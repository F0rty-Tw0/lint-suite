import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Program, SourceFile } from 'typescript';
import { test } from 'vitest';

import type {
  Aggregate,
  FileEdges,
  ModuleResolution
} from './common/no-unused-exports.type.ts';
import { diskResolver } from './disk-resolver.ts';
import { exportIndex } from './export-index.ts';
import {
  derivedProgram,
  editedSourceFile,
  filesProgram,
  fixtureProgram,
  fixtureSourceFile,
  staleProgram
} from './test/utils/fixture-program.spec.util.ts';
import { buildAggregate } from './utils/aggregate-update.util.ts';
import { moduleEdges } from './utils/module-edges.util.ts';

const FIXTURE = 'unused-exports';

const program = fixtureProgram(FIXTURE);
const aggregate = exportIndex(program);
const roots = program.getRootFileNames().slice();

const fileName = (file: string): string => {
  return fixtureSourceFile(program, FIXTURE, file).fileName;
};

const usageOf = (index: Aggregate, file: string, name: string): number => {
  return index.usage.get(fileName(file))?.get(name) ?? 0;
};

const isIndexed = (source: Program, file: SourceFile): boolean => {
  if (file.isDeclarationFile) return false;

  const isExternal = source.isSourceFileFromExternalLibrary(file);

  return !isExternal;
};

const indexedFiles = (source: Program): SourceFile[] => {
  const files = source.getSourceFiles();

  return files.filter((file) => isIndexed(source, file));
};

const freshAggregate = (source: Program): Aggregate => {
  const checker = source.getTypeChecker();
  const isExternal = (file: SourceFile): boolean =>
    source.isSourceFileFromExternalLibrary(file);
  const onDisk = diskResolver(source);
  const resolution: ModuleResolution = { checker, isExternal, onDisk };
  const byFile = new Map<string, FileEdges>();

  for (const file of indexedFiles(source)) {
    byFile.set(file.fileName, moduleEdges(file, resolution));
  }

  return buildAggregate(byFile);
};

const savedProgram = (file: string, text: string): Program => {
  const edited = editedSourceFile(program, FIXTURE, file, text);

  return derivedProgram(program, roots, edited);
};

test('caches the aggregate per program', () => {
  assert.equal(exportIndex(program), aggregate);
});

test('counts a direct import as usage of the declaring export', () => {
  assert.ok(usageOf(aggregate, 'used.ts', 'usedValue') > 0);
});

test('counts a type-only import as usage', () => {
  assert.ok(usageOf(aggregate, 'types.type.ts', 'UsedType') > 0);
});

test('follows a named re-export back to the declaring file', () => {
  assert.ok(usageOf(aggregate, 'barrel.ts', 'throughBarrel') > 0);
  assert.ok(usageOf(aggregate, 'origin.ts', 'throughBarrel') > 0);
});

test('leaves a re-exported name nobody imports unused everywhere', () => {
  assert.equal(usageOf(aggregate, 'barrel.ts', 'barrelDead'), 0);
  assert.equal(usageOf(aggregate, 'origin.ts', 'barrelDead'), 0);
});

test('follows a star re-export to the declaring file', () => {
  assert.ok(usageOf(aggregate, 'star-origin.ts', 'viaStar') > 0);
  assert.equal(usageOf(aggregate, 'star-origin.ts', 'starDead'), 0);
});

test('marks every file that another file imports', () => {
  assert.ok(aggregate.imported.has(fileName('origin.ts')));
  assert.ok(aggregate.imported.has(fileName('consumer.ts')));
  assert.ok(!aggregate.imported.has(fileName('orphan-module.ts')));
  assert.ok(!aggregate.imported.has(fileName('orphan-star.ts')));
});

test('indexes edges for every non declaration file', () => {
  const edges = aggregate.byFile.get(fileName('cycle-a.ts'));

  assert.ok(edges);
  assert.deepEqual(edges.exports, ['CycleShape', 'cycleA']);
});

test('patches the index in place when a plain importer drops an import', () => {
  const text =
    "import { consumed } from './consumer';\n\nexport const started = consumed.id;\n";
  const saved = savedProgram('main.ts', text);

  const index = exportIndex(saved);

  assert.equal(index, aggregate);
  assert.equal(usageOf(index, 'cycle-a.ts', 'cycleA'), 0);
  assert.ok(usageOf(index, 'consumer.ts', 'consumed') > 0);
});

test('patches the index in place when a plain importer gains an import', () => {
  const text =
    "import { starDead } from './star-origin';\n\nexport const started = starDead;\n";
  const saved = savedProgram('main.ts', text);

  const index = exportIndex(saved);

  assert.equal(index, aggregate);
  assert.equal(usageOf(index, 'star-origin.ts', 'starDead'), 1);
  assert.equal(usageOf(index, 'consumer.ts', 'consumed'), 0);
});

test('rebuilds from scratch when a barrel changes', () => {
  const text = "export { throughBarrel } from './origin';\n";
  const saved = savedProgram('barrel.ts', text);

  const index = exportIndex(saved);
  const fresh = freshAggregate(saved);

  assert.notEqual(index, aggregate);
  assert.deepEqual(index.usage, fresh.usage);
  assert.deepEqual(index.imported, fresh.imported);
  assert.deepEqual(index.starTouched, fresh.starTouched);
});

test('forgets a removed file without rebuilding', () => {
  const restored = derivedProgram(program, roots, undefined);
  const before = exportIndex(restored);
  const kept = roots.filter((root) => !root.endsWith('orphan-module.ts'));
  const shrunk = derivedProgram(program, kept, undefined);

  const index = exportIndex(shrunk);

  assert.equal(index, before);
  assert.equal(index.byFile.has(fileName('orphan-module.ts')), false);
  assert.ok(usageOf(index, 'used.ts', 'usedValue') > 0);
});

test('keeps aggregates of different projects apart', () => {
  const projectA = derivedProgram(program, roots, undefined, {
    configFilePath: 'tsconfig.project-a.json'
  });
  const indexA = exportIndex(projectA);
  const usageBefore = usageOf(indexA, 'used.ts', 'usedValue');
  const text =
    "import { starDead } from './star-origin';\n\nexport const started = starDead;\n";
  const edited = editedSourceFile(program, FIXTURE, 'main.ts', text);
  const projectB = derivedProgram(program, roots, edited, {
    configFilePath: 'tsconfig.project-b.json'
  });

  const indexB = exportIndex(projectB);
  const indexAAgain = exportIndex(projectA);

  assert.notEqual(indexB, indexA);
  assert.equal(indexAAgain, indexA);
  assert.equal(usageOf(indexAAgain, 'used.ts', 'usedValue'), usageBefore);
  assert.equal(usageOf(indexAAgain, 'star-origin.ts', 'starDead'), 0);
  assert.equal(usageOf(indexB, 'star-origin.ts', 'starDead'), 1);
});

test('links an importer to a file that was not a module when first indexed', () => {
  const text = 'export const later = 1;\n';
  const saved = savedProgram('empty-target.ts', text);

  const index = exportIndex(saved);

  assert.ok(index.imported.has(fileName('empty-target.ts')));
  assert.equal(usageOf(index, 'empty-target.ts', 'later'), 1);
});

test('links an importer to a file created after the import was written', () => {
  const directory = mkdtempSync(join(tmpdir(), 'lint-suite-exports-'));
  const importer = join(directory, 'importer.ts');
  const target = join(directory, 'later.ts');

  writeFileSync(
    importer,
    "import { later } from './later';\n\nexport const started = later;\n"
  );

  const before = filesProgram([importer]);
  const dangling = exportIndex(before);

  assert.equal(dangling.imported.size, 0);

  writeFileSync(target, 'export const later = 1;\n');

  const after = staleProgram(before, [importer, target]);
  const index = exportIndex(after);
  const targetFile = after.getSourceFile(target);

  rmSync(directory, { force: true, recursive: true });

  assert.ok(targetFile);
  assert.ok(index.imported.has(targetFile.fileName));
  assert.equal(index.usage.get(targetFile.fileName)?.get('later'), 1);
});
