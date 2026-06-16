declare module 'stylelint-scss' {
  import type { Plugin } from 'stylelint';

  // Default export is an array of stylelint plugin objects (one per rule).
  const plugins: Plugin[];
  export default plugins;
}
