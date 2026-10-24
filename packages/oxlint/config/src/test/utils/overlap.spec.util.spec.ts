import { describe, expect, it } from 'vitest';

import { lostAgainstPlain } from './overlap.spec.util.ts';
import { CONSOLE_ON, CONSOLE_OXLINT } from '../common/overlap.const.ts';

describe('FEATURE: lostAgainstPlain', () => {
  describe('GIVEN a plain config that enables no-console on .ts files', () => {
    it('WHEN neither the mirrored config nor oxlint enables it THEN it is lost', async () => {
      const lost = await lostAgainstPlain([CONSOLE_ON], [], {}, 'src/a.ts');

      expect(lost).toEqual(['no-console']);
    });

    it('WHEN the mirrored config enables it THEN nothing is lost', async () => {
      const lost = await lostAgainstPlain(
        [CONSOLE_ON],
        [CONSOLE_ON],
        {},
        'src/a.ts'
      );

      expect(lost).toEqual([]);
    });

    it('WHEN oxlint enables it THEN nothing is lost', async () => {
      const lost = await lostAgainstPlain(
        [CONSOLE_ON],
        [],
        CONSOLE_OXLINT,
        'src/a.ts'
      );

      expect(lost).toEqual([]);
    });
  });
});
