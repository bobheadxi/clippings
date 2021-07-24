import { RequestParam } from 'obsidian';
import fetch from 'node-fetch';

export type RequestOptions = {
  headers?: Record<string, string>;
} & RequestParam;

export default async function request(req: RequestOptions): Promise<string> {
  const res = await fetch(req.url, {
    headers: { ...req.headers, 'Content-Type': 'application/json' },
    method: req.method,
    body: req.body,
  });
  const data = await res.text();
  if (!res.ok) {
    throw new Error(`${res.statusText}: ${data}`);
  }
  return data;
}
