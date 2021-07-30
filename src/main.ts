import { Plugin } from 'obsidian';
import deepmerge from 'deepmerge';
import Integration, { integrationsRegistry } from './lib/integrations';

const path = require('path');

import { ClippingsSettingsTab, AllSettings } from './settings';

export default class Clippings extends Plugin {
  integrations: Integration<any, any>[];

  async onload() {
    console.log('loading plugin');

    const settings = await this.loadSettings();
    for (let EnabledIntegration of integrationsRegistry) {
      const int = new EnabledIntegration(this.app, settings.pluginSettings, {
        settings: settings.integrations[EnabledIntegration.id],
        secrets: settings.secrets[EnabledIntegration.id],
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
