import { test, expect, describe } from '@jest/globals';

import runMigrations from '.';
import { ReferenceVersion } from '..';

describe('runMigrations', () => {
  test(ReferenceVersion.V1, () => {
    const migrated = runMigrations(
      'test',
      {
        reference_format: ReferenceVersion.V0,
        source: 'https://bobheadxi.dev',
      },
      `---
reference_format: v0
source: https://bobheadxi.dev
---

#reference/tag #tag
# Title

Description

---

## Highlights

### Something`
    );
    expect(migrated.frontmatter.reference_format).toEqual(ReferenceVersion.V1);
    expect(migrated.frontmatter.publisher).toEqual('https://bobheadxi.dev');
    expect(migrated.frontmatter.source).toBeFalsy();
    expect(migrated.body.includes('---')).toBeFalsy();
    expect(
      migrated.body.includes(`Description

#reference/tag #tag

## Highlights`)
    ).toBeTruthy();
  });
});
