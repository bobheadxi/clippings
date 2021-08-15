import { Highlight } from 'src/reference';

function isRelevantLine(str: string) {
  // Obsidian seems to generate '**' from pastes from Google Docs
  return str.length > 2;
}

type ParsedArticle = {
  url?: string;
  title?: string;
  highlights: Highlight[];
};

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
export function parseArticles(content: string): Record<string, ParsedArticle> {
  const chunks = content
    .split('>')
    .filter(isRelevantLine) // drop noise
    .map((c) => `>${c}`); // add back quotes
  if (!chunks || chunks.length === 0) {
    throw new Error('Note content does not look like highlights');
  }

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
  return articles;
}
