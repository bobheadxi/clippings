export interface PluginSettings {
  referenceTag?: string;
  newNotesFolder?: string;
  newNotesTags?: string[];
}

export interface AllSettings {
  integrations?: Record<string, any>;
  secrets?: Record<string, any>;
  pluginSettings?: PluginSettings;
}
