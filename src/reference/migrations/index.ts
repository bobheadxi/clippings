import { Migration } from './migration';

import V1 from './v1';
import V1_1, { Frontmatter as CurrentFrontmatter } from './v1_1';

export const CurrentVersion = CurrentFrontmatter.reference_format;

const allMigrations: Migration[] = [new V1(), new V1_1()];

/**
 * All available migrations.
 */
export default function runMigrations(
  filename: string,
  frontmatter: any,
  fileContents: string,
  migrations = allMigrations
): { frontmatter: any; body: string } {
  // strip frontmatter from body
  let body = fileContents.replace(/^(---)[\s\S]*?(---)/, '').trimStart();
  const migrated = { frontmatter, body };

  // execute migrations
  migrations.forEach((migration) => {
    if (!migration.shouldMigrate(frontmatter?.['reference_format'])) return;
    console.log(`Running migration to ${migration.version()} on '${filename}'`);

    const newlyMigrated = migration.migrate(
      migrated.frontmatter,
      migrated.body
    );
    migrated.body = newlyMigrated.body;
    migrated.frontmatter = newlyMigrated.frontmatter;
  });

  return migrated;
}
