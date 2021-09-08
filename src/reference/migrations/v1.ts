import { ReferenceVersion } from 'src/reference';

import { Migration } from './migration';

export class Frontmatter {
  static reference_format = ReferenceVersion.V1;

  url: string;
  author: string;
  publisher: string;
  published: string;
}

export default class V1 implements Migration {
  version() {
    return Frontmatter.reference_format;
  }

  shouldMigrate(version: ReferenceVersion) {
    // only migrate from v0
    return version === ReferenceVersion.V0 || !version;
  }

  migrate(
    frontmatter: any,
    body: string
  ): { frontmatter: Frontmatter; body: string } {
    frontmatter.reference_format = this.version();

    // zero-value some defaults
    frontmatter.author = frontmatter.author || '';
    frontmatter.publisher = frontmatter.publisher || frontmatter.source || '';
    frontmatter.source = undefined;
    frontmatter.published = frontmatter.published || '';

    // Remove divider
    body = body.replace('\n---\n\n', '\n');

    // Move tags under description
    const lines = body.split('\n');
    const tags = lines.find((line) => line.trim().match(/^(#)[^\s\\]+/));
    body = body.replace(tags + '\n', '');
    if (body.includes('## Highlights')) {
      body = body.replace('## Highlights', `${tags}\n\n## Highlights`);
    } else {
      body += `\n\n${tags}\n`;
    }

    return {
      frontmatter,
      body,
    };
  }
}
