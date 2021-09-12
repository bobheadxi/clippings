import { Highlight } from 'src/reference';
import { IntegrationReference } from '../integration';

export default function parseReference(doc: Document): IntegrationReference {
  const title = doc.querySelector('h1')?.textContent.trim();
  const author = doc.querySelector('h2')?.textContent.trim();

  const annotations = doc.querySelectorAll('div[class="annotation"]');
  const highlights: Highlight[] = [];
  annotations.forEach((annotation) => {
    const chapter = annotation.querySelector('div[class="annotationchapter"]');
    const annotatedTexts = annotation.querySelectorAll(
      'p[class="annotationrepresentativetext"]'
    );
    const annotatedTextChunks: string[] = [];
    annotatedTexts.forEach((highlight) =>
      highlight?.textContent
        ? annotatedTextChunks.push(highlight.textContent.trim())
        : undefined
    );
    const notes = annotation.querySelectorAll('p[class="annotationnote"]');
    const notesChunks: string[] = [];
    notes.forEach((note) =>
      note?.textContent ? notesChunks.push(note.textContent.trim()) : undefined
    );
    highlights.push({
      quote: annotatedTextChunks.join('\n'),
      comment: notesChunks.join('\n') || undefined,
      location: chapter?.textContent.trim(),
    });
  });

  if (highlights.length === 0) {
    throw new Error('No highlights detected');
  }

  return {
    title,
    author,
    highlights,
  };
}
