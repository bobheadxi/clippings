import { describe, test, expect } from '@jest/globals';

import * as parseutil from './parseutil';

describe('parseLink', () => {
  test('simple case', () => {
    const parsed = parseutil.parseLink(
      '[Looking Closely is Everything](https://craigmod.com/essays/looking_closely/) Nice comment!'
    );
    expect(parsed.title).toEqual('Looking Closely is Everything');
    expect(parsed.url).toEqual('https://craigmod.com/essays/looking_closely/');
    expect(parsed.comment).toEqual('Nice comment!');
  });

  test('with noise', () => {
    const parsed = parseutil.parseLink(
      '- [Looking Closely is Everything](https://craigmod.com/essays/looking_closely/) Nice comment!'
    );
    expect(parsed.title).toEqual('Looking Closely is Everything');
    expect(parsed.url).toEqual('https://craigmod.com/essays/looking_closely/');
    expect(parsed.comment).toEqual('Nice comment!');
  });
});

describe('detectHighlightDelimiter', () => {
  test('detect >', () => {
    const delims = parseutil.detectHighlightDelimiter(`
> quote

stuff

> quote

stuff
`);
    expect(delims.delim).toEqual(parseutil.HighlightDelimiter.QUOTE);
    expect(delims.indent).toEqual('');
  });

  test('detect indented -', () => {
    const delims = parseutil.detectHighlightDelimiter(`
- stuff
  - quote
  - quote
`);
    expect(delims.delim).toEqual(parseutil.HighlightDelimiter.DASH);
    expect(delims.indent).toEqual('  ');
  });

  test('detect indented - complex case', () => {
    const delims = parseutil.detectHighlightDelimiter(`
- stuff
  - quote
  - quote
    - comment
- stuff
  - quote
`);
    expect(delims.delim).toEqual(parseutil.HighlightDelimiter.DASH);
    expect(delims.indent).toEqual('  ');
  });
});

describe('splitChunks', () => {
  test('>', () => {
    const chunks = parseutil.splitChunks(
      `
> quote (chunk 1)

stuff

> quote (chunk 2)

stuff
`,
      { delim: parseutil.HighlightDelimiter.QUOTE, indent: '' }
    );
    expect(chunks).toHaveLength(2);
    for (let c of chunks) {
      expect(c.includes('stuff'));
    }
  });

  test('-', () => {
    const chunks = parseutil.splitChunks(
      `
- stuff
  - quote
  - quote
`,
      { delim: parseutil.HighlightDelimiter.DASH, indent: '  ' }
    );
    expect(chunks).toHaveLength(3);
  });

  test('- complex case', () => {
    const chunks = parseutil.splitChunks(
      `
- stuff (chunk 1)
  - quote (chunk 2)
  - quote (chunk 3)
    - comment
      - another comment
    - comment
  - quote (chunk 4)
    - comment
- stuff (chunk 5)
  - quote (chunk 6)
`,
      { delim: parseutil.HighlightDelimiter.DASH, indent: '  ' }
    );
    expect(chunks).toHaveLength(6);
  });
});
