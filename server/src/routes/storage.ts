import { Router, type IRouter, type Request, type Response } from 'express';

import {
  ObjectNotFoundError,
  ObjectStorageService,
} from '../lib/objectStorage';

interface UploadUrlRequest {
  name: string;
  size: number;
  contentType: string;
}

function parseUploadUrlRequest(value: unknown): UploadUrlRequest | null {
  if (typeof value !== 'object' || value === null) return null;

  const candidate = value as Record<string, unknown>;
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
  const contentType =
    typeof candidate.contentType === 'string' ? candidate.contentType.trim() : '';
  const size = candidate.size;

  if (
    !name ||
    name.length > 255 ||
    !contentType ||
    contentType.length > 255 ||
    !Number.isInteger(size) ||
    Number(size) <= 0 ||
    Number(size) > 100 * 1024 * 1024
  ) {
    return null;
  }

  return {
    name,
    contentType,
    size: Number(size),
  };
}

function requireAuthenticatedRequest(req: Request, res: Response): boolean {
  if (req.isAuthenticated()) return true;

  res.status(401).json({ error: 'Authentication required.' });
  return false;
}

function streamObject(
  res: Response,
  download: Awaited<ReturnType<ObjectStorageService['downloadObject']>>,
): void {
  res.setHeader('Content-Type', download.contentType);
  res.setHeader('Cache-Control', download.cacheControl);
  if (download.contentLength !== undefined) {
    res.setHeader('Content-Length', String(download.contentLength));
  }

  download.body.on('error', () => {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream object.' });
      return;
    }
    res.destroy();
  });
  download.body.pipe(res);
}

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

router.post(
  '/storage/uploads/request-url',
  async (req: Request, res: Response) => {
    if (!requireAuthenticatedRequest(req, res)) return;

    const uploadRequest = parseUploadUrlRequest(req.body);
    if (!uploadRequest) {
      res.status(400).json({ error: 'Missing or invalid required fields.' });
      return;
    }

    try {
      const target = await objectStorageService.createObjectEntityUploadTarget({
        filename: uploadRequest.name,
        contentType: uploadRequest.contentType,
      });

      res.json({
        ...target,
        metadata: uploadRequest,
      });
    } catch (error) {
      req.log.error({ err: error }, 'Error generating upload URL');
      res.status(500).json({ error: 'Failed to generate upload URL.' });
    }
  },
);

router.get(
  '/storage/public-objects/*filePath',
  async (req: Request, res: Response) => {
    try {
      const raw = req.params.filePath;
      const filePath = Array.isArray(raw) ? raw.join('/') : raw;
      if (!filePath) {
        res.status(400).json({ error: 'Object path is required.' });
        return;
      }

      const object = await objectStorageService.searchPublicObject(filePath);
      if (!object) {
        res.status(404).json({ error: 'Object not found.' });
        return;
      }

      const download = await objectStorageService.downloadObject(object);
      streamObject(res, download);
    } catch (error) {
      req.log.error({ err: error }, 'Error serving public object');
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to serve public object.' });
      }
    }
  },
);

router.get('/storage/objects/*path', async (req: Request, res: Response) => {
  if (!requireAuthenticatedRequest(req, res)) return;

  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join('/') : raw;
    if (!wildcardPath) {
      res.status(400).json({ error: 'Object path is required.' });
      return;
    }

    const object = await objectStorageService.getObjectEntityFile(
      `/objects/${wildcardPath}`,
    );
    const download = await objectStorageService.downloadObject(object);
    streamObject(res, download);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: 'Object not found.' });
      return;
    }

    req.log.error({ err: error }, 'Error serving private object');
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to serve private object.' });
    }
  }
});

export default router;
