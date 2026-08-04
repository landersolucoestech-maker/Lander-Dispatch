import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

function findWorkspaceRoot(startPath: string): string | null {
  let current = path.resolve(startPath);

  while (true) {
    if (
      existsSync(path.join(current, 'pnpm-workspace.yaml')) &&
      existsSync(path.join(current, 'package.json'))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

export function loadEnvironment(): void {
  const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
  const workspaceRoot =
    findWorkspaceRoot(process.cwd()) ??
    findWorkspaceRoot(moduleDirectory);

  if (!workspaceRoot) return;

  const originalEnvironment = new Map(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );

  for (const filename of ['.env', '.env.local']) {
    const envPath = path.join(workspaceRoot, filename);
    if (existsSync(envPath)) {
      process.loadEnvFile(envPath);
    }
  }

  for (const [name, value] of originalEnvironment) {
    process.env[name] = value;
  }
}

loadEnvironment();
