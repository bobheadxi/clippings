import request from './request';

export type SourceMetadata = {
  url: string;
  title: string;
  author?: string;
  description?: string;
  source_name?: string;
};

// TODO: switch to https://github.com/microlinkhq/metascraper
export async function getMeta(
  title: string,
  url: string
): Promise<SourceMetadata> {
  const meta: SourceMetadata = {
    url,
    title,
  };

  // get doc
  const html = await request({
    url,
  });
  // const html = content.replace(/\\"/g, '"'); // some fuckin shit going on with escaping
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // get title
  if (!meta.title) {
    // fallback based on: https://github.com/zolrath/obsidian-auto-link-title/blob/main/scraper.ts
    const title =
      doc.querySelector('meta[property="og:title"]') || doc.head.title;
    if (typeof title === 'string') {
      meta.title = title;
    } else if (title.getText().length) {
      meta.title = title.getText();
    } else {
      // If site is javascript based and has a no-title attribute when unloaded, use it.
      const noTitle = title.getAttr('no-title');
      if (noTitle != null) {
        meta.title = noTitle;
      }
    }
  }

  function maybeRSSHasTitle() {
    const rss = doc
      .querySelector('link[type="application/rss+xml"]')
      ?.getAttribute('title');
    if (!rss || rss.toLowerCase().contains('rss')) return null;
    return rss;
  }

  function maybeTitleHasAuthor() {
    const by = meta.title.split('by ');
    if (by.length < 2) return null;
    return by.pop().split(/ [|\-*]/g)[0];
  }

  // get other meta
  meta.author =
    (
      doc.querySelector('meta[property="og:author"]') ||
      doc.querySelector('meta[name="author"]')
    )?.getAttribute('content') || maybeTitleHasAuthor();
  meta.description = (
    doc.querySelector('meta[property="og:description"]') ||
    doc.querySelector('meta[name="description"]')
  )?.getAttribute('content');
  meta.url =
    doc.querySelector('meta[property="og:url"]')?.getAttribute('content') ||
    doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ||
    url;
  meta.source_name =
    doc
      .querySelector('meta[property="og:site_name"]')
      ?.getAttribute('content') ||
    maybeRSSHasTitle() ||
    new URL(meta.url).hostname;

  return meta;
}
