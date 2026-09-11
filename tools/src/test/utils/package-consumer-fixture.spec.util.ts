import { copyFile, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isMap, isScalar, parseDocument } from 'yaml';

const fixtureDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'fixtures',
  'package-consumer'
);

export const allowedBuilds = async (): Promise<Record<string, boolean>> => {
  const source = await readFile('pnpm-workspace.yaml', 'utf8');
  const document = parseDocument(source);
  const parseError = document.errors[0];

  if (parseError) throw parseError;

  const configuration = document.get('allowBuilds', true);

  if (!isMap(configuration)) {
    throw new Error('Expected pnpm-workspace.yaml to define allowBuilds');
  }

  const builds: Record<string, boolean> = {};

  for (const item of configuration.items) {
    const key = item.key;
    const value = item.value;

    if (!isScalar(key) || !isScalar(value)) {
      throw new Error('Expected allowBuilds to contain scalar package entries');
    }

    const name: unknown = key.value;
    const allowed: unknown = value.value;

    if (typeof name !== 'string' || typeof allowed !== 'boolean') {
      throw new Error(
        'Expected allowBuilds to contain boolean package entries'
      );
    }

    builds[name] = allowed;
  }

  return builds;
};

export const copyConsumerFixtures = async (consumer: string): Promise<void> => {
  const declarationSource = join(fixtureDirectory, 'declarations.ts');
  const smokeSource = join(fixtureDirectory, 'smoke.ts');

  await copyFile(declarationSource, join(consumer, 'consumer.ts'));
  await copyFile(smokeSource, join(consumer, 'smoke.ts'));
};
