import { Plugin, PluginSettingTab, Setting, normalizePath } from 'obsidian';
import deepmerge from 'deepmerge';
import { integrationsRegistry } from './integrations';
import Integration from './integrations/integration';

import { AllSettings, PluginSettings } from './settings';

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

    this.registerInterval(
      window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000)
    );
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
          text.setValue(this.plugin.pluginSettings.referenceTag);
          text.onChange((value) => {
            this.plugin.pluginSettings.referenceTag = !value.startsWith('#')
              ? `#${value}`
              : value;
          });
        });
      new Setting(containerEl)
        .setName('Folder for new references')
        .addText((text) => {
          text.setValue(this.plugin.pluginSettings.newNotesFolder);
          text.onChange((value) => {
            this.plugin.pluginSettings.newNotesFolder = value;
          });
        });
      new Setting(containerEl)
        .setName('Tags for new references')
        .setDesc('Additional comma-separated tags for new notes')
        .addText((text) => {
          text.setValue(this.plugin.pluginSettings.newNotesTags.join(','));
          text.onChange((value) => {
            this.plugin.pluginSettings.newNotesTags = value
              .split(',')
              .map((t) => (!t.startsWith('#') ? `#${t}` : t));
          });
        });
      new Setting(containerEl)
        .setName('Import as quotes')
        .addToggle((toggle) => {
          toggle.setDisabled(true); // TODO
          toggle.setTooltip('WIP');
        });
    }

    // Integrations options
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
    for (let integration of this.plugin.integrations) {
      integration.contributeSettings(containerEl, async () => {
        const config = integration.getSettings();
        await this.plugin.saveSettings({
          integrations: { [integration.getID()]: config.settings },
          secrets: { [integration.getID()]: config.secrets },
        });
      });
    }
  }
}
