import { RequestParam as obsidianRequestParam, request } from 'obsidian';

export type RequestParam = obsidianRequestParam;

export default async function makeRequest(req: RequestParam): Promise<string> {
  return await request(req);
}
