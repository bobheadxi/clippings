import { DateTime } from 'luxon';

import request from './request';

function maybeRSSHasPublisher(doc: Document) {
  const rss = doc
    .querySelector('link[type="application/rss+xml"]')
    ?.getAttribute('title');
  if (!rss || rss.toLowerCase().contains('rss')) return null;
  return rss;
}

function maybeTitleHasAuthor(title: string) {
  const by = title.split('by ');
  if (by.length < 2) return null;
  return by.pop().split(/ [|\-*]/g)[0];
}

export type SourceMetadata = {
  url: string;
  title: string;
  author?: string;
  description?: string;
  publisher?: string;
  published?: DateTime;
};

export async function getMeta(
  providedTitle: string,
  providedURL: string
): Promise<SourceMetadata> {
  const html = await request({ url: providedURL });
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const title =
    doc.querySelector('meta[property="og:title"]').getText() ||
    doc.head.title ||
    providedTitle;
  const url =
    doc.querySelector('meta[property="og:url"]')?.getAttribute('content') ||
    doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ||
    providedURL;

  const meta: SourceMetadata = {
    url,
    title,

    description: (
      doc.querySelector('meta[property="og:description"]') ||
      doc.querySelector('meta[name="description"]')
    )?.getAttribute('content'),

    author:
      (
        doc.querySelector('meta[property="og:author"]') ||
        doc.querySelector('meta[name="author"]')
      )?.getAttribute('content') || maybeTitleHasAuthor(title),

    publisher:
      doc
        .querySelector('meta[property="og:site_name"]')
        ?.getAttribute('content') ||
      maybeRSSHasPublisher(doc) ||
      new URL(url).hostname,
    // published: msMeta.date ? DateTime.fromISO(msMeta.date) : null,
  };

  return meta;
}
