import type { FileEdges } from '../../common/no-unused-exports.type.ts';

type FileEdgesOverrides = { readonly fileName: string };

type FileEdgesInput = Partial<FileEdges> & FileEdgesOverrides;

export const fileEdgesStub = (overrides: FileEdgesInput): FileEdges => {
  const edges: FileEdges = {
    exports: [],
    declared: new Set(),
    imports: [],
    reExports: [],
    starTargets: [],
    skipped: false,
    ...overrides
  };

  return edges;
};

export const byFileStub = (edges: FileEdges[]): Map<string, FileEdges> => {
  const byFile = new Map<string, FileEdges>();

  for (const entry of edges) {
    byFile.set(entry.fileName, entry);
  }

  return byFile;
};
