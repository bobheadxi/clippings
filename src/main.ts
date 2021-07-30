import { Plugin, PluginSettingTab, Setting } from 'obsidian';
import deepmerge from 'deepmerge';
import { integrationsRegistry } from './lib/integrations';
import Integration from './lib/integrations/integration';

const path = require('path');

import { AllSettings } from './settings';

export default class Clippings extends Plugin {
  integrations: Integration<any, any>[] = [];

  async onload() {
    console.log('loading plugin');

    const settings = await this.loadSettings();
    for (let EnabledIntegration of integrationsRegistry) {
      console.log(`enabling integration '${EnabledIntegration.id}'`);
      const int = new EnabledIntegration(this.app, settings.pluginSettings, {
        settings: settings.integrations[EnabledIntegration.id] || {},
        secrets: settings.secrets[EnabledIntegration.id] || {},
      });
      int.contributeToPlugin(this);
      this.integrations.push(int);
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
    return path.join(
      this.app.vault.configDir,
      `${this.manifest.id}-secrets.json`
    );
  }

  async loadSettings(): Promise<AllSettings> {
    let secrets = {};
    try {
      secrets = JSON.parse(
        await this.app.vault.adapter.read(this.getSecretsPath())
      );
    } catch (err) {
      console.log('initializing secrets');
      await this.app.vault.adapter.write(
        this.getSecretsPath(),
        JSON.stringify(secrets)
      );
    }
    return Object.assign({}, await this.loadData(), {
      secrets,
      integrations: {},
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
    this.app.vault.adapter.write(
      this.getSecretsPath(),
      JSON.stringify(settings.secrets)
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
        .setName('Folder for new references')
        .addText((text) => {
          text.setDisabled(true); // TODO
        });
      new Setting(containerEl)
        .setName('Folder for existing references')
        .addText((text) => {
          text.setDisabled(true); // TODO
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
