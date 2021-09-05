import { ReferenceVersion } from 'src/reference';

/**
 * Migrate notes between versions.
 */
export abstract class Migration {
  abstract version(): ReferenceVersion;
  /**
   * Each file should check shouldMigrate, and if valid, should provide the contents of
   * the file to migrate and write it back.
   */
  abstract shouldMigrate(version: ReferenceVersion): boolean;
  /**
   * Migrates given file contents to a newer format.
   */
  abstract migrate(
    frontmatter: any,
    body: string
  ): { frontmatter: any; body: string };
}
