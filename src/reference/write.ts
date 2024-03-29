import { App, normalizePath, stringifyYaml } from 'obsidian';

import { Reference } from 'src/reference';
import { PluginSettings } from 'src/plugin/settings';
import {
  buildFrontmatter,
  renderHighlights,
  renderHeader,
  renderTags,
} from './render';

export async function generateNote(
  app: App,
  basePath: string,
  reference: Reference,
  tags: {
    referenceTag?: string;
    newNotesTags?: string[];
  }
) {
  const { meta, highlights } = reference;
  const renderedHighlights = renderHighlights(highlights);
  const filename = normalizePath(`${basePath}/${reference.filename}`);

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
    await app.vault.modify(
      referenceFile,
      `${contents}\n\n${renderedHighlights}`
    );
  } else {
    // Create new reference note
    console.log(`Generating '${filename}'`, reference);

    const noteContent = `---
${stringifyYaml(buildFrontmatter(meta))}---

${renderHeader(meta)}
${reference.comment || 'TODO'}

${renderTags(tags.referenceTag, tags.newNotesTags)}

## Highlights

${renderedHighlights}`;

    referenceFile = await app.vault.create(filename, noteContent);
  }
  return referenceFile;
}
