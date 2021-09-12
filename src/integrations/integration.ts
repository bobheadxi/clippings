import { Plugin } from 'obsidian';
import { PluginSettings as PluginSettings } from 'src/settings';
import { sanitizeFilename } from 'src/lib/file';
import { getMeta, Metadata } from 'src/lib/url';
import { Reference, Highlight } from 'src/reference';
import { generateNote } from 'src/reference/write';

import { LoginModal, Credentials } from './login';

/**
 * Denotes a reference imported from a integration.
 */
export type IntegrationReference = {
  url?: string;
  title?: string;
  author?: string;
  comment?: string;
  highlights: Highlight[];
};

/**
 * Integrations should extend this class and be added to `integrationsRegistry` to be loaded.
 */
export default abstract class Integration<
  IntegrationSettingsT,
  IntegrationsSecretsT
> {
  private plugin: Plugin;

  /**
   * This ID must also be available as `static id = 'my-id'` on each Integration.
   *
   * Static abstract is not supported by TypeScript: https://github.com/microsoft/TypeScript/issues/34516
   */
  abstract getID(): string;

  /**
   * Plugin-wide configuration.
   */
  protected pluginSettings: PluginSettings;
  /**
   * Integration settings.
   */
  protected settings: IntegrationSettingsT;
  /**
   * Integration secrets.
   */
  protected secrets: IntegrationsSecretsT;

  getSettings() {
    return {
      settings: this.settings,
      secrets: this.secrets,
    };
  }

  /**
   * Initialize plugin.
   */
  constructor(
    plugin: Plugin,
    pluginSettings: PluginSettings,
    integrationConfig: {
      settings: IntegrationSettingsT;
      secrets: IntegrationsSecretsT;
    }
  ) {
    this.plugin = plugin;
    this.pluginSettings = pluginSettings || {};
    this.settings = integrationConfig.settings;
    this.secrets = integrationConfig.secrets;
  }

  /**
   * Implement this hook to add settings to the plugin configuration UI.
   *
   * @param settings settings UI element to add configuration options to
   * @param saveSettings callback to persist configuration changes to vault
   */
  abstract contributeSettings(
    settings: HTMLElement,
    saveSettings: () => Promise<void>
  ): void;

  /**
   * Import references into vault as notes.
   */
  protected async importReferences(importRefs: IntegrationReference[]) {
    // fetch metadata
    const references: Reference[] = [];
    for (let ref of importRefs) {
      try {
        let meta: Metadata;
        if (ref.url) {
          meta = await getMeta(ref.title, ref.url);
        } else {
          meta = { ...ref };
        }
        const filename = `${sanitizeFilename(meta.title)}.md`;
        references.push({
          meta,
          highlights: ref.highlights,
          comment: ref.comment,
          filename,
        });
      } catch (err) {
        console.error(`Failed to get metadata for source: ${err}`, { ref });
        throw new Error(
          `Failed to get metadata for source '${ref.title || ref.url}': ${err}`
        );
      }
    }

    // generate or update files
    const generatedNotes = [];
    for (let reference of references) {
      try {
        const referenceFile = await generateNote(
          this.plugin.app,
          reference,
          this.settings
        );
        generatedNotes.push(referenceFile);
      } catch (err) {
        throw new Error(
          `Failed to generate note for '${reference.filename}': ${err}`
        );
      }
    }
    return generatedNotes;
  }

  /**
   * Initializes a modal for configuring credentials.
   */
  protected createLoginModal(
    title: string,
    description: string,
    loginCallback: (credentials: Credentials) => Promise<void>,
    onClose?: (success: boolean) => void
  ): LoginModal {
    return new LoginModal(
      this.plugin.app,
      title,
      description,
      loginCallback,
      onClose
    );
  }
}
