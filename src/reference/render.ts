import { Highlight, ReferenceVersion } from 'src/reference';
import { SourceMetadata } from 'src/lib/url';
import { isoNow } from 'src/lib/time';

export function buildFrontmatter(meta: SourceMetadata) {
  return {
    url: meta.url,
    author: meta.author || '',
    publisher: meta.publisher || '',
    published: meta.published.toISO(),
    created: isoNow(),
    reference_format: ReferenceVersion.V0,
  };
}

export function renderHighlights(highlights: Highlight[]) {
  return highlights
    .map((h) => `### TODO\n\n${h.quote}${h.comment ? `\n\n${h.comment}` : ''}`)
    .join('\n\n');
}

export function renderTags(referenceTag: string, additionalTags: string[]) {
  const tags = [
    `${referenceTag ? referenceTag : '#reference'}/TODO`,
    ...(additionalTags ? additionalTags : ['#review']),
  ];
  return tags.join(' ');
}

export function renderHeader(meta: SourceMetadata) {
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
}
${
  displayMetadata
    ? `
– ${displayMetadata}`
    : ''
}`;
}
