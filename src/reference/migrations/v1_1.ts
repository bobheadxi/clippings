import { ReferenceVersion } from 'src/reference';

import { Migration } from './migration';

export class Frontmatter {
  static reference_format = ReferenceVersion.V1_1;
}

export default class V1_1 implements Migration {
  version() {
    return Frontmatter.reference_format;
  }

  shouldMigrate(version: ReferenceVersion) {
    return version === ReferenceVersion.V1;
  }

  migrate(frontmatter: any, body: string): { frontmatter: any; body: string } {
    frontmatter.reference_format = this.version();

    if (frontmatter.url) {
      body = body.replace(/(^#\s.*)/gm, frontmatter.url);
    } else {
      body = body.replace(/(^#\s.*\n)/gm, '');
    }

    return {
      frontmatter,
      body,
    };
  }
}
