import { App, normalizePath, stringifyYaml } from 'obsidian';

import { Reference } from 'src/reference';
import { PluginSettings } from 'src/settings';
import {
  buildFrontmatter,
  renderHighlights,
  renderHeader,
  renderTags,
} from './render';

export async function generateNote(
  app: App,
  reference: Reference,
  settings: PluginSettings
) {
  const { filename, meta, highlights } = reference;
  const renderedHighlights = renderHighlights(highlights);

  // Generate or append to a file
  let referenceFile;
  if (await app.vault.adapter.exists(filename)) {
    // Append to existing reference note
    referenceFile = app.metadataCache.getFirstLinkpathDest(filename, '');
    console.log(`Adding to '${filename}'`, {
      file: reference,
      refNote: referenceFile,
    });

    const contents = await app.vault.read(referenceFile);
    console.log(contents);
    await app.vault.modify(
      referenceFile,
      `${contents}\n\n${renderedHighlights}`
    );
  } else {
    // Create new reference note
    console.log(`Generating '${filename}'`, reference);

    const noteContent = `---
${stringifyYaml(buildFrontmatter(meta))}
---

${renderHeader(meta)}

${reference.comment || 'TODO'}

${renderTags(settings.referenceTag, settings.newNotesTags)}

## Highlights

${renderedHighlights}`;

    referenceFile = await app.vault.create(
      normalizePath(
        `${
          settings.newNotesFolder || app.fileManager.getNewFileParent('').path
        }/${filename}`
      ),
      noteContent
    );
  }
  return referenceFile;
}
