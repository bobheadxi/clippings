import { SourceMetadata } from 'src/lib/url';

export type Highlight = {
  quote: string;
  comment?: string;
};

export type Reference = {
  meta: SourceMetadata;
  comment?: string;
  highlights: Highlight[];

  // where this reference is saved
  filename: string;
};

export enum ReferenceVersion {
  V0 = 'v0',
}

export const CURRENT_REFERENCE_VERSION = ReferenceVersion.V0;
