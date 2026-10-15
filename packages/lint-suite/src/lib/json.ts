import jsonPlugin from '@eslint/json';
import { defineConfig } from 'eslint/config';

export const json = defineConfig([
  {
    plugins: { json: jsonPlugin }
  },
  {
    files: ['**/*.json'],
    language: 'json/json',
    extends: [jsonPlugin.configs.recommended]
  },
  {
    files: [
      '**/tsconfig*.json',
      '**/jsconfig*.json',
      '**/.vscode/*.json',
      '**/.devcontainer.json',
      '**/.devcontainer/**/devcontainer.json',
      '**/angular.json',
      '**/.oxlintrc.json'
    ],
    language: 'json/jsonc',
    languageOptions: { allowTrailingCommas: true }
  }
]);
