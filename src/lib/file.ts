/**
 * https://forum.obsidian.md/t/list-of-not-allowed-characters-in-the-file-name-make-it-os-specific/892
 */
export function sanitizeFilename(str: string) {
  return str
    .replace(/[:]/g, ' -')
    .replace(/[|]/g, '-')
    .replace(/[*"\\/<>?]/g, '');
}
