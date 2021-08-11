import { SourceMetadata } from 'src/lib/url';

export type Highlight = {
  quote: string;
  comment?: string;
};

export type Reference = {
  meta: SourceMetadata;
  filename: string;
  highlights: Highlight[];
};

export enum ReferenceVersion {
  V0 = 'v0',
}

export const CURRENT_REFERENCE_VERSION = ReferenceVersion.V0;
