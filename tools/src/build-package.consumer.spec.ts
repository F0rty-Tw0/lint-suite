import { describe, it } from 'vitest';

import {
  createPackageConsumer,
  runPackageConsumerSmoke,
  typecheckPackageConsumer
} from './test/utils/package-consumer.spec.util.ts';

describe('FEATURE: packed package consumer', (): void => {
  describe('GIVEN built public packages', (): void => {
    it('WHEN installed in isolation THEN dependencies and declarations resolve', async (): Promise<void> => {
      const consumer = await createPackageConsumer();

      try {
        runPackageConsumerSmoke(consumer);
        typecheckPackageConsumer(consumer);
      } finally {
        await consumer.dispose();
      }
    }, 300_000);
  });
});
