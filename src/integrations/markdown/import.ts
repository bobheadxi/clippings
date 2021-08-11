import { TFile, App } from 'obsidian';

import { sanitizeFilename } from 'src/lib/file';
import { PluginSettings } from 'src/settings';
import { getMeta } from 'src/lib/url';
import { Reference } from 'src/reference';
import { generateNote } from 'src/reference/write';
import { parseArticles } from './parse';

/**
 * Generates a reference note from a note with arbitrary numbers of entries in the
 * following format:
 *
 *    > QUOTE
 *
 *    OPTIONAL COMMENT
 *
 *    [OPTIONAL TITLE](URL)
 *
 * This can, for example, be generated with an IFTTT integration between Instapaper and
 * Google Docs.
 */
export default async function importReferenceNotes(
  app: App,
  file: TFile,
  settings: PluginSettings
): Promise<string[]> {
  let content = '';
  try {
    content = await app.vault.read(file);
    console.log('generating reference notes', { file, content });
  } catch (err) {
    throw new Error(`Failed to read note '${file.path}': ${err}`);
  }

  const articles = parseArticles(content);

  // fetch metadata
  const references: Reference[] = [];
  for (const [url, source] of Object.entries(articles)) {
    try {
      const meta = await getMeta(source.title, url);
      const filename = `${sanitizeFilename(meta.title)}.md`;
      references.push({ meta, filename, highlights: source.highlights });
    } catch (err) {
      throw new Error(
        `Failed to get metadata for source '${source.url}': ${err}`
      );
    }
  }

  // generate files
  const creationFolder =
    settings.newNotesFolder || app.fileManager.getNewFileParent('').path;
  const generatedNotes = [];
  for (let reference of references) {
    try {
      const referenceFile = await generateNote(app, reference, {
        creationFolder,
      });
      generatedNotes.push(
        app.fileManager.generateMarkdownLink(referenceFile, file.path)
      );
    } catch (err) {
      throw new Error(
        `Failed to generate note for '${reference.filename}': ${err}`
      );
    }
  }

  return generatedNotes;
}
