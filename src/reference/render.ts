import { Metadata } from 'src/lib/url';

import { defaultReferenceTag } from 'src/settings';
import { Highlight, ReferenceVersion } from 'src/reference';
import { isoNow } from 'src/lib/time';

// Correspond to current version of frontmatter
import { Frontmatter } from './migrations/v1';

type BaseFrontmatter = { created: string; reference_format: ReferenceVersion };

export function buildFrontmatter(
  meta: Metadata
): Frontmatter & BaseFrontmatter {
  return {
    ...Frontmatter,
    created: isoNow(),

    url: meta.url,
    author: meta.author || '',
    publisher: meta.publisher || '',
    published: meta.published?.toISO(),
  };
}

export function renderHighlights(highlights: Highlight[]) {
  return highlights
    .map(
      (h) => `### TODO\n\n> ${h.quote}${h.comment ? `\n\n${h.comment}` : ''}`
    )
    .join('\n\n');
}

export function renderTags(referenceTag: string, additionalTags: string[]) {
  const tags = [
    `${referenceTag ? referenceTag : defaultReferenceTag}/TODO`,
    ...(additionalTags ? additionalTags : ['#review']),
  ];
  return tags.join(' ');
}

export function renderHeader(meta: Metadata) {
  const displayMetadata = [
    meta.author,
    meta.publisher ? `*${meta.publisher}*` : '',
  ]
    .filter((v) => v && v.length > 2)
    .join(', ');
  return `# [${meta.title}](${meta.url})
${
  meta.description
    ? `
> ${meta.description}`
    : ''
}${
    displayMetadata
      ? `
– ${displayMetadata}`
      : ''
  }`;
}
