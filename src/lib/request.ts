import { RequestParam, request } from 'obsidian';

export type RequestOptions = {
  // Obsidian does not yet support headers.
  // headers?: Record<string, string>;
} & RequestParam;

export default async function makeRequest(
  req: RequestOptions
): Promise<string> {
  return await request(req);
}
