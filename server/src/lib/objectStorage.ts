import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface StoredObject {
  bucket: string;
  key: string;
  isPublic: boolean;
}

export interface DownloadedObject {
  body: Readable;
  contentType: string;
  contentLength?: number;
  cacheControl: string;
}

export interface UploadTarget {
  uploadURL: string;
  objectPath: string;
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super('Object not found');
    this.name = 'ObjectNotFoundError';
  }
}

function requiredStorageValue(name: string, developmentFallback?: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;

  if (process.env.NODE_ENV === 'development' && developmentFallback) {
    return developmentFallback;
  }

  throw new Error(`${name} is required for object storage.`);
}

function normalizeObjectKey(value: string): string {
  const key = value.replaceAll('\\', '/').replace(/^\/+/, '');
  const segments = key.split('/').filter(Boolean);

  if (
    segments.length === 0 ||
    segments.some((segment) => segment === '.' || segment === '..')
  ) {
    throw new Error('Invalid object key.');
  }

  return segments.join('/');
}

function safeFilename(value: string): string {
  const normalized = value
    .trim()
    .replaceAll('\\', '/')
    .split('/')
    .at(-1)
    ?.replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'upload.bin';
}

function isNotFound(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as {
    name?: string;
    $metadata?: { httpStatusCode?: number };
  };

  return (
    candidate.name === 'NotFound' ||
    candidate.name === 'NoSuchKey' ||
    candidate.$metadata?.httpStatusCode === 404
  );
}

export class ObjectStorageService {
  private readonly client: S3Client;
  private readonly privateBucket: string;
  private readonly publicBuckets: string[];

  constructor() {
    const endpoint = requiredStorageValue(
      'S3_ENDPOINT',
      'http://127.0.0.1:9000',
    );
    const accessKeyId = requiredStorageValue('S3_ACCESS_KEY', 'minioadmin');
    const secretAccessKey = requiredStorageValue(
      'S3_SECRET_KEY',
      'minioadmin',
    );

    this.privateBucket = requiredStorageValue(
      'S3_PRIVATE_BUCKET',
      'lander-dispatch-private',
    );
    this.publicBuckets = (
      process.env.S3_PUBLIC_BUCKETS ??
      process.env.S3_PUBLIC_BUCKET ??
      'lander-dispatch-public'
    )
      .split(',')
      .map((bucket) => bucket.trim())
      .filter(Boolean);

    this.client = new S3Client({
      endpoint,
      region: process.env.S3_REGION?.trim() || 'us-east-1',
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  private async objectExists(bucket: string, key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return true;
    } catch (error) {
      if (isNotFound(error)) return false;
      throw error;
    }
  }

  async searchPublicObject(filePath: string): Promise<StoredObject | null> {
    const key = normalizeObjectKey(filePath);

    for (const bucket of this.publicBuckets) {
      if (await this.objectExists(bucket, key)) {
        return { bucket, key, isPublic: true };
      }
    }

    return null;
  }

  async downloadObject(object: StoredObject): Promise<DownloadedObject> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: object.bucket, Key: object.key }),
    );

    if (!(response.Body instanceof Readable)) {
      throw new Error('Object storage returned an unsupported response stream.');
    }

    return {
      body: response.Body,
      contentType: response.ContentType || 'application/octet-stream',
      contentLength: response.ContentLength,
      cacheControl: object.isPublic
        ? 'public, max-age=3600'
        : 'private, no-store',
    };
  }

  async createObjectEntityUploadTarget({
    filename,
    contentType,
  }: {
    filename: string;
    contentType: string;
  }): Promise<UploadTarget> {
    const key = normalizeObjectKey(
      `uploads/${randomUUID()}/${safeFilename(filename)}`,
    );
    const command = new PutObjectCommand({
      Bucket: this.privateBucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadURL = await getSignedUrl(this.client, command, {
      expiresIn: 15 * 60,
    });

    return {
      uploadURL,
      objectPath: `/objects/${key}`,
    };
  }

  async getObjectEntityFile(objectPath: string): Promise<StoredObject> {
    if (!objectPath.startsWith('/objects/')) {
      throw new ObjectNotFoundError();
    }

    const key = normalizeObjectKey(objectPath.slice('/objects/'.length));
    if (!(await this.objectExists(this.privateBucket, key))) {
      throw new ObjectNotFoundError();
    }

    return {
      bucket: this.privateBucket,
      key,
      isPublic: false,
    };
  }

  async deleteObjectEntity(objectPath: string): Promise<void> {
    const object = await this.getObjectEntityFile(objectPath);
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: object.bucket,
        Key: object.key,
      }),
    );
  }
}