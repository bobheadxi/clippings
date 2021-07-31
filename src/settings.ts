export interface PluginSettings {
  newNotesFolder?: string;
}

export interface AllSettings {
  integrations?: Record<string, any>;
  secrets?: Record<string, any>;
  pluginSettings?: PluginSettings;
}
