import { test, expect, describe } from '@jest/globals';
import { Metadata } from 'src/lib/url';

import * as render from './render';

describe('renderHeader', () => {
  const meta: Metadata = {
    title: 'testarticle',
    url: 'https://bobheadxi.dev',
  };
  test('just description', () => {
    const h = render.renderHeader({ ...meta, description: 'my description' });
    expect(h).toEqual(`# [${meta.title}](${meta.url})

> my description
`);
  });

  test('just author', () => {
    const h = render.renderHeader({ ...meta, author: 'bobheadxi' });
    expect(h).toEqual(`# [${meta.title}](${meta.url})

– bobheadxi
`);
  });

  test('description and author', () => {
    const h = render.renderHeader({
      ...meta,
      description: 'my description',
      author: 'bobheadxi',
    });
    expect(h).toEqual(`# [${meta.title}](${meta.url})

> my description

– bobheadxi
`);
  });
});
