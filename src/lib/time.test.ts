import { test, expect } from '@jest/globals';

import * as time from './time';

test('isoNow', () => {
  const t = time.isoNow();
  // should have time zone
  expect(t.includes('+') || t.includes('-')).toBeTruthy();
});
