import {
  Plugin,
  PluginSettingTab,
  Setting,
  normalizePath,
  stringifyYaml,
  Notice,
  TFile,
} from 'obsidian';
import deepmerge from 'deepmerge';

import integrationsRegistry from 'src/integrations';
import Integration from 'src/integrations/integration';
import runMigrations, { CurrentVersion } from 'src/reference/migrations';

import { AllSettings, defaultReferenceTag, PluginSettings } from './settings';

export default class Clippings extends Plugin {
  integrations: Integration<any, any>[] = [];
  pluginSettings: PluginSettings;

  async onload() {
    console.log('loading plugin');

    const settings = await this.loadSettings();
    this.pluginSettings = settings.pluginSettings || {};

    for (let EnabledIntegration of integrationsRegistry) {
      console.log(`enabling integration '${EnabledIntegration.id}'`);
      const integrationConfig = {
        settings: settings.integrations[EnabledIntegration.id] || {},
        secrets: settings.secrets[EnabledIntegration.id] || {},
      };
      const integration = new EnabledIntegration(
        this,
        this.pluginSettings,
        integrationConfig
      );
      this.integrations.push(integration);
    }

    this.addSettingTab(new ClippingsSettingsTab(this));

    this.addCommand({
      id: 'migrate.single',
      name: `Migrate current note to format ${CurrentVersion}`,
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new Notice('No active file found!');
          return;
        }
        await this.maybeMigrateNote(file);
      },
    });
    this.addCommand({
      id: 'migrate.all',
      name: `Migrate all notes to format ${CurrentVersion}`,
      callback: async () => {
        const files = this.app.vault.getMarkdownFiles();
        for (let file of files) {
          await this.maybeMigrateNote(file);
        }
      },
    });
  }

  onunload() {
    console.log('unloading plugin');
  }

  getSecretsPath() {
    return normalizePath(
      `${this.app.vault.configDir}/${this.manifest.id}-secrets.json`
    );
  }

  async loadSettings(): Promise<AllSettings> {
    // load separated secrets
    let secrets = {};
    try {
      secrets = JSON.parse(
        await this.app.vault.adapter.read(this.getSecretsPath())
      );
    } catch (err) {
      console.log(`initializing secrets, could not find existing: ${err}`);
      await this.app.vault.adapter.write(
        this.getSecretsPath(),
        JSON.stringify(secrets)
      );
    }

    // load simple config
    let safeData = { integrations: {}, pluginSettings: {} };
    try {
      safeData = await this.loadData();
    } catch (err) {
      console.log(
        `initializing plugin settings, could not find existing: ${err}`
      );
      await this.saveData(safeData);
    }
    return Object.assign({}, safeData, {
      secrets,
    }) as AllSettings;
  }

  async saveSettings(settings: AllSettings) {
    const oldSettings = await this.loadSettings();
    const newSettings = deepmerge(oldSettings, settings);

    // only save non-secrets as normal data
    const cleanSettings = Object.assign({}, newSettings);
    cleanSettings.secrets = null;
    await this.saveData(cleanSettings);

    // save secrets
    await this.app.vault.adapter.write(
      this.getSecretsPath(),
      JSON.stringify(newSettings.secrets)
    );
  }

  async maybeMigrateNote(file: TFile) {
    const meta = this.app.metadataCache.getFileCache(file);
    if (
      meta.tags?.find((tc) =>
        tc.tag.startsWith(
          this.pluginSettings.referenceTag || defaultReferenceTag
        )
      )
    ) {
      console.log(`migrating '${file.path}'`);
      const fileContents = await this.app.vault.read(file);
      const frontmatter = { ...meta.frontmatter, position: undefined as any };
      const migrated = runMigrations(file.path, frontmatter, fileContents);
      await this.app.vault.modify(
        file,
        `---
${stringifyYaml(migrated.frontmatter)}---

${migrated.body}`
      );
    } else {
      console.log(`skipping '${file.path}'`, { tags: meta.tags });
    }
  }
}

class ClippingsSettingsTab extends PluginSettingTab {
  plugin: Clippings;

  constructor(plugin: Clippings) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;
    containerEl.empty();

    // References options
    containerEl.createEl('h2', { text: 'References' });
    {
      new Setting(containerEl)
        .setName('Reference tag')
        .setDesc('Root tag for reference notes')
        .addText((text) => {
          text.setValue(
            this.plugin.pluginSettings.referenceTag || defaultReferenceTag
          );
          text.onChange((value) => {
            this.plugin.pluginSettings.referenceTag = !value.startsWith('#')
              ? `#${value}`
              : value;
          });
        });
      new Setting(containerEl)
        .setName('Folder for new references')
        .addText((text) => {
          text.setValue(
            this.plugin.pluginSettings.newNotesFolder || 'reference'
          );
          text.onChange((value) => {
            this.plugin.pluginSettings.newNotesFolder = value;
          });
        });
      new Setting(containerEl)
        .setName('Tags for new references')
        .setDesc('Additional comma-separated tags for new notes')
        .addText((text) => {
          text.setValue(
            (this.plugin.pluginSettings.newNotesTags || []).join(',')
          );
          text.onChange((value) => {
            this.plugin.pluginSettings.newNotesTags = value
              .split(',')
              .map((t) => (!t.startsWith('#') ? `#${t}` : t));
          });
        });
    }

    // General integrations options
    containerEl.createEl('h2', { text: 'Integrations' });
    containerEl.appendChild(
      createFragment((el) => {
        el.append(
          `Integrations secrets (e.g. for authentication) are stored in  `,
          el.createEl('code', {
            text: this.plugin.getSecretsPath(),
          }),
          `  - make sure to add this file to your `,
          el.createEl('code', {
            text: '.gitignore',
          }),
          ` if you are using Git with your vault!`
        );
      })
    );

    // Per-integration options
    for (let integration of this.plugin.integrations) {
      console.log(`${integration.getID()}: Registering configuration`);
      try {
        integration.contributeSettings(containerEl, async () => {
          const config = integration.getSettings();
          await this.plugin.saveSettings({
            integrations: { [integration.getID()]: config.settings },
            secrets: { [integration.getID()]: config.secrets },
          });
        });
      } catch (err) {
        console.log(`${integration.getID()}: ${err}`);
      }
    }
  }
}
