import { RequestUrlParam, request } from 'obsidian';

export type RequestParam = RequestUrlParam;

export default async function makeRequest(req: RequestParam): Promise<string> {
  return await request(req);
}
