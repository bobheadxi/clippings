import { DateTime } from 'luxon';

export function isoNow(): string {
  return DateTime.now().setZone('local').toISO();
}
