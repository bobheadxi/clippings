import { TFile, App, normalizePath } from 'obsidian';

import { isoNow } from 'src/lib/time';
import { sanitizeFilename } from 'src/lib/file';
import { PluginSettings } from 'src/settings';
import { getMeta, SourceMetadata } from 'src/lib/url';

function isRelevantLine(str: string) {
  // Obsidian seems to generate '**' from pastes from Google Docs
  return str.length > 2;
}

type Highlight = {
  quote: string;
  comment?: string;
};

function renderHighlights(highlights: Highlight[]) {
  return highlights
    .map((h) => `### TODO\n\n${h.quote}${h.comment ? `\n\n${h.comment}` : ''}`)
    .join('\n\n');
}

async function generateNote(
  app: App,
  reference: {
    meta: SourceMetadata;
    filename: string;
    highlights: any;
  },
  creationFolder: string
) {
  const { filename, meta, highlights } = reference;
  const renderedHighlights = renderHighlights(highlights);
  const displayMetadata = [
    meta.author,
    meta.publisher ? `*${meta.publisher}*` : '',
  ]
    .filter((v) => v && v.length > 2)
    .join(', ');

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
url: ${meta.url}
author: ${meta.author || ''}
publisher: ${meta.publisher || ''}
published: ${meta.published.toISO()}
created: ${isoNow()}
reference_format: v0
---

#reference/TODO #review
# [${meta.title}](${meta.url})
${
  meta.description
    ? `
> ${meta.description}`
    : ''
}
${
  displayMetadata
    ? `
– ${displayMetadata}`
    : ''
}

TODO

---

## Highlights

${renderedHighlights}`;

    referenceFile = await app.vault.create(
      normalizePath(`${creationFolder}/${filename}`),
      noteContent
    );
  }
  return referenceFile;
}

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
export default async function generateReferenceNotes(
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

  const chunks = content
    .split('>')
    .filter(isRelevantLine) // drop noise
    .map((c) => `>${c}`); // add back quotes
  if (!chunks || chunks.length === 0) {
    throw new Error('Note content does not look like highlights');
  }

  type ParsedArticle = {
    url?: string;
    title?: string;
    highlights: Highlight[];
  };
  const articles: Record<string, ParsedArticle> = {};
  for (let chunk of chunks) {
    const lines = chunk.split('\n');
    const article: ParsedArticle = {
      url: null,
      title: null,
      highlights: [],
    };
    for (let l of lines) {
      const line = l.trim();
      if (!line) {
        continue;
      }
      console.log(article.highlights);
      if (line.startsWith('>')) {
        article.highlights.push({ quote: line });
      } else if (line.startsWith('[')) {
        const parts = line.split(']');
        article.title = parts[0].slice(1).trim();
        article.url = parts[1].slice(1, -1).trim();
      } else {
        // try to capture as comment
        if (!isRelevantLine(line) || article.highlights.length != 1) {
          continue;
        }
        article.highlights[article.highlights.length - 1].comment = line;
      }
    }
    if (!article.url) {
      console.log('Discarding chunk with no URL', article);
      continue;
    }

    if (!articles[article.url]) {
      articles[article.url] = article;
    } else {
      articles[article.url].highlights = articles[
        article.url
      ].highlights.concat(article.highlights);
      if (!articles[article.url]) {
        articles[article.url].title = article.title;
      }
    }
  }

  if (Object.keys(articles).length === 0) {
    throw new Error('No articles found in content');
  } else {
    console.log('Found articles', articles);
  }

  // fetch metadata
  const references = [];
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
      const referenceFile = await generateNote(app, reference, creationFolder);
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
