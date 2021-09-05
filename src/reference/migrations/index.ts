import { Migration } from './migration';

import V1, { Frontmatter as CurrentFrontmatter } from './v1';

export const CurrentVersion = CurrentFrontmatter.reference_format;

const migrations: Migration[] = [new V1()];

/**
 * All available migrations.
 */
export default function runMigrations(
  filename: string,
  frontmatter: any,
  fileContents: string
): { frontmatter: any; body: string } {
  // strip frontmatter
  let body = fileContents.replace(/^(---)[\s\S]*?(---)/, '').trimStart();
  const migrated = { frontmatter, body };

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
