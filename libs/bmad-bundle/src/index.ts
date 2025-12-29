import path from 'path';
import { fileURLToPath } from 'url';

export const BMAD_BUNDLE_VERSION = '6.0.0-alpha.23';

function getPackageRoot(): string {
  const thisFilePath = fileURLToPath(import.meta.url);
  // Go up one level from dist/ to reach the package root (bmad-bundle/)
  return path.resolve(path.dirname(thisFilePath), '..');
}

export function getBmadBundleDir(): string {
  return path.join(getPackageRoot(), 'bundle', '_bmad');
}

export function getBmadAgentManifestPath(): string {
  return path.join(getBmadBundleDir(), '_config', 'agent-manifest.csv');
}
