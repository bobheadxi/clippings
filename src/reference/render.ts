import { Metadata } from '@bobheadxi/metadata';

import { Highlight, CURRENT_REFERENCE_VERSION } from 'src/reference';
import { isoNow } from 'src/lib/time';

export function buildFrontmatter(meta: Metadata) {
  return {
    url: meta.url,
    author: meta.author || '',
    publisher: meta.publisher || '',
    published: meta.published?.toISO(),
    created: isoNow(),
    reference_format: CURRENT_REFERENCE_VERSION,
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
    `${referenceTag ? referenceTag : '#reference'}/TODO`,
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
