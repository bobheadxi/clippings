import { test, expect, describe } from '@jest/globals';

import runMigrations from '.';
import { ReferenceVersion } from '..';
import V1 from './v1';
import V1_1 from './v1_1';

describe('runMigrations', () => {
  test(ReferenceVersion.V1_1, () => {
    const migrated = runMigrations(
      'test',
      {
        reference_format: ReferenceVersion.V1,
        url: 'https://bobheadxi.dev/extending-search/',
      },
      `
# [Title](https://bobheadxi.dev/extending-search/)

Description

## Highlights

### Something`,
      [new V1_1()]
    );
    expect(migrated.frontmatter.reference_format).toEqual(
      ReferenceVersion.V1_1
    );
    expect(migrated.frontmatter.url).toEqual(
      'https://bobheadxi.dev/extending-search/'
    );
    expect(migrated.body).toEqual(`https://bobheadxi.dev/extending-search/

Description

## Highlights

### Something`);
  });

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

### Something`,
      [new V1()]
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
