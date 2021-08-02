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

function maybeDate(datestring: string): DateTime | null {
  if (!datestring) return null;
  for (let parseFunc of [DateTime.fromISO, DateTime.fromHTTP]) {
    try {
      return parseFunc(datestring);
    } catch (err) {
      continue;
    }
  }
  return null;
}

class JSONLDData {
  private data: any[];
  constructor(data: any[]) {
    this.data = data;
  }
  get(property: string) {
    let value;
    this.data.find((item) => {
      if (!item) return;
      value = property.split('.').reduce((o, i) => o[i], item);
      return !!value || value === 0 || value === true;
    });
    return value;
  }
}

async function maybeJSONLD(doc: Document): Promise<JSONLDData | null> {
  const jsonldData = Array.from(
    doc.querySelectorAll('script[type="application/ld+json"]')
  )
    .map((element) => {
      try {
        return JSON.parse(element.getText());
      } catch (err) {
        return undefined;
      }
    })
    .filter((json) => json);
  if (!jsonldData) return null;
  try {
    return new JSONLDData(jsonldData);
  } catch (err) {
    return null;
  }
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
  const jsonld = await maybeJSONLD(doc);

  const title =
    doc.querySelector('meta[property="og:title"]').getText() ||
    doc.head.title ||
    jsonld?.get('headline') ||
    providedTitle;
  const url =
    doc.querySelector('meta[property="og:url"]')?.getAttribute('content') ||
    doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ||
    providedURL;

  // refer to https://sourcegraph.com/github.com/microlinkhq/metascraper/-/tree/packages when in doubt
  const meta: SourceMetadata = {
    url,
    title,

    description:
      (
        doc.querySelector('meta[property="og:description"]') ||
        doc.querySelector('meta[name="description"]')
      )?.getAttribute('content') || jsonld?.get('description'),

    author:
      (
        doc.querySelector('meta[property="og:author"]') ||
        doc.querySelector('meta[name="author"]')
      )?.getAttribute('content') ||
      jsonld?.get('author.name') ||
      maybeTitleHasAuthor(title),

    publisher:
      doc
        .querySelector('meta[property="og:site_name"]')
        ?.getAttribute('content') ||
      maybeRSSHasPublisher(doc) ||
      new URL(url).hostname,

    published: maybeDate(
      doc
        .querySelector('meta[property="article:published_time"]')
        ?.getAttribute('content') || jsonld?.get('datePublished')
    ),
  };

  return meta;
}
