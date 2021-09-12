import { delimiter } from 'path';

export function isRelevantLine(str: string) {
  // Obsidian seems to generate '**' from pastes from Google Docs, we can filter this
  // out alongside whitespace stuff we don't need
  return str.length > 2;
}

// parseLink handles a '[title](url) some comments'
export function parseLink(line: string) {
  const titleParts = line.split(']');
  const title = titleParts[0].split('[')[1].trim(); // inside []

  const urlParts = titleParts[1].split(')', 2);
  const url = urlParts[0].slice(1).trim(); // inside ()

  return {
    title,
    url,
    // capture everything remaining as a comment
    comment: urlParts.length > 1 ? urlParts[1].trim() : undefined,
  };
}

export enum HighlightDelimiter {
  QUOTE = '>',
  ASTERISK = '*',
  DASH = '-',
}

export type Delimiter = {
  delim: HighlightDelimiter;
  indent: string;
};

/**
 * Does some heuristics to guess what is being used to delimit highlights.
 *
 * TODO: this might be complete garbage hmm
 */
export function detectHighlightDelimiter(content: string): Delimiter {
  const counts: Record<string, Record<string, number>> = {
    [HighlightDelimiter.QUOTE]: {},
    [HighlightDelimiter.ASTERISK]: {},
    [HighlightDelimiter.DASH]: {},
  };
  const delimiters = Object.keys(counts);

  const lines = content.split('\n').filter(isRelevantLine);
  lines.forEach((l, i) => {
    const line = l.trimLeft();
    const indent = l.split(line).join('');
    if (!line || !delimiters.includes(line[0])) return;
    counts[line[0]][indent] = (counts[line[0]][indent] || 0) + 1;
  });

  let mostCommon: Delimiter & { count: number } = {
    delim: HighlightDelimiter.QUOTE,
    indent: '',
    count: 0,
  };
  delimiters.forEach((delim) => {
    const mostCommonIndent = Object.keys(counts[delim]).reduce(
      (a, b) => (counts[delim][a] > counts[delim][b] ? a : b),
      ''
    );
    const count = counts[delim][mostCommonIndent];
    mostCommon =
      count > mostCommon.count
        ? {
            delim: delim as HighlightDelimiter,
            indent: mostCommonIndent,
            count,
          }
        : mostCommon;
  });

  return mostCommon;
}

/**
 * Each chunk denotes potential highlight for a source.
 */
export function splitChunks(content: string, delimiter: Delimiter): string[] {
  const { indent, delim } = delimiter;
  const split = '\n' + indent + delim;
  const chunks = content
    .split(split)
    // drop noise
    .filter(isRelevantLine)
    // add back split
    .reduce((acc, c, i) => {
      const original =
        i > 0 || content.includes(`${split}${c}`) ? `${split}${c}` : c;
      // special case to handle less-indented items polluting chunks
      // TODO this is rather hack
      if (indent.length > 0) {
        const splitLessIndented = '\n' + delim;
        const parts = original
          .split(splitLessIndented, 2)
          .filter((p) => p.length > 1);
        if (parts.length > 1) {
          return acc.concat(parts[0], splitLessIndented + parts[1]);
        }
      }
      return acc.concat(original);
    }, [] as string[]);
  if (!chunks || chunks.length === 0) {
    throw new Error('Note content does not look like highlights');
  }
  return chunks;
}
