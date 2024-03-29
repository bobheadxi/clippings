import { Metadata } from 'src/lib/url';

export type Highlight = {
  quote: string;
  comment?: string;
  location?: string;
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
  V1_1 = 'v1.1',
}
