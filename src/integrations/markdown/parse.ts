import * as parseutil from './parseutil';

import { IntegrationReference } from '../integration';

/**
 * Generates a reference note from a note with arbitrary numbers of entries in the
 * following format:
 *
 *    > HIGHLIGHT
 *
 *    OPTIONAL COMMENT
 *
 *    [OPTIONAL TITLE](URL)
 *
 * This can, for example, be generated with an IFTTT integration between Instapaper and
 * Google Docs.
 */
export function parseArticles(
  content: string
): Record<string, IntegrationReference> {
  const delimiter = parseutil.detectHighlightDelimiter(content);
  const chunks = parseutil.splitChunks(content, delimiter);

  const { delim, indent } = delimiter;
  const prefix = indent + delim;

  const articles: Record<string, IntegrationReference> = {};
  let previous: IntegrationReference;
  for (let chunk of chunks) {
    const article: IntegrationReference = { highlights: [] };

    const lines = chunk.split('\n').filter(parseutil.isRelevantLine);
    for (let line of lines) {
      // Figure out what this is and include it in the 'article' detected in this chunk.
      if (line.startsWith(prefix)) {
        // Capture highlight if it starts with our prefix
        const cleaned = line.slice(prefix.length).trim();
        if (cleaned) article.highlights.push({ quote: cleaned });
      } else if (line.replace(delim, '').trim().startsWith('[')) {
        // Capture source if there is a link near start of line
        const { title, url, comment } = parseutil.parseLink(line.trim());
        article.title = title;
        article.url = url;
        article.comment = comment;
      } else {
        // Capture as comment
        if (article.highlights.length < 1) {
          continue;
        }
        let cleaned = line.trim();
        if (cleaned.startsWith(delim)) {
          cleaned = cleaned.slice(delim.length);
        }
        article.highlights[article.highlights.length - 1].comment = cleaned;
      }
    }

    if (!article.url) {
      if (previous) {
        previous.highlights = previous.highlights.concat(article.highlights);
      } else {
        console.log(
          'Discarding chunk with no URL and no preceding source',
          article
        );
      }
      continue;
    }

    if (!articles[article.url]) {
      articles[article.url] = article;
      previous = articles[article.url];
    } else {
      articles[article.url].highlights = articles[
        article.url
      ].highlights.concat(article.highlights);
    }
  }

  if (Object.keys(articles).length === 0) {
    throw new Error('No articles found in content');
  } else {
    console.log('Found articles', articles);
  }
  return articles;
}
