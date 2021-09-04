import { Metadata } from 'src/lib/url';

export type Highlight = {
  quote: string;
  comment?: string;
};

export type Reference = {
  meta: Metadata;
  comment?: string;
  highlights: Highlight[];

  // where this reference is saved
  filename: string;
};

export enum ReferenceVersion {
  V0 = 'v0',
  V1 = 'v1',
}

export const CURRENT_REFERENCE_VERSION = ReferenceVersion.V1;
