import { RequestParam } from 'obsidian';
import fetch from 'node-fetch';

export type RequestOptions = {
  headers?: Record<string, string>;
} & RequestParam;

export default async function request(req: RequestOptions): Promise<string> {
  console.log(req);
  const res = await fetch(req.url, { ...req });
  const data = await res.text();
  if (!res.ok) {
    throw new Error(`${res.statusText}: ${data} (${res.status})`);
  }
  return data;
}
