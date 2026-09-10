import { mkdir, rm } from 'node:fs/promises';

import { bundlePackage } from './build-package-bundle.ts';
import { buildPackageContext } from './build-package-context.ts';
import { emitPackageDeclarations } from './build-package-declarations.ts';
import { writePublishedManifest } from './build-package-manifest.ts';

const packageRoot = process.argv[2];

if (!packageRoot) {
  throw new Error('Usage: node tools/src/build-package.ts <project-root>');
}

const context = await buildPackageContext(packageRoot);

await rm(context.outputRoot, { force: true, recursive: true });
await mkdir(context.outputRoot, { recursive: true });
await bundlePackage(context);

const emitted = await emitPackageDeclarations(context);

if (emitted) {
  await writePublishedManifest(context);
}
