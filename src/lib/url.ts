import request from 'src/lib/request';
import { parseMeta, Metadata as md } from '@bobheadxi/metadata';

export type Metadata = md;

export async function getMeta(
  providedTitle: string,
  providedURL: string
): Promise<Metadata> {
  const html = await request({ url: providedURL });
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const meta = parseMeta(doc);

  if (!meta.title) meta.title = providedTitle;
  if (!meta.url) meta.url = providedURL;

  return meta;
}
