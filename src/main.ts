import { App, Modal, Notice, Plugin } from 'obsidian';
import InstapaperAPI from './lib/integrations/instapaper';
const path = require('path');

import {
  ClippingsSettingsTab,
  ClippingsSettings,
  DEFAULT_SETTINGS,
} from './settings';

export default class Clippings extends Plugin {
  settings: ClippingsSettings;

  async onload() {
    console.log('loading plugin');

    await this.loadSettings();

    this.addCommand({
      id: 'open-sample-modal',
      name: 'Open Sample Modal',
      callback: async () => {
        console.log('Simple Callback');
        await new InstapaperAPI(this.settings.secrets.instapaper).verifyLogin();
      },
      // checkCallback: (checking: boolean) => {
      //   let leaf = this.app.workspace.activeLeaf;
      //   if (leaf) {
      //     if (!checking) {
      //       new SampleModal(this.app).open();
      //     }
      //     return true;
      //   }
      //   return false;
      // },
    });

    this.addSettingTab(new ClippingsSettingsTab(this.app, this));

    this.registerInterval(
      window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000)
    );
  }

  onunload() {
    console.log('unloading plugin');
  }

  getSecretsPath() {
    return path.join(this.app.vault.configDir, 'clippings-secrets.json');
  }

  async loadSettings() {
    let secrets = DEFAULT_SETTINGS.secrets;
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
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData(), {
      secrets,
    });
  }

  async saveSettings() {
    // split and save normal settings separately
    const cleanSettings = Object.assign({}, this.settings);
    cleanSettings.secrets = null;
    await this.saveData(cleanSettings);
    // save secrets
    this.app.vault.adapter.write(
      this.getSecretsPath(),
      JSON.stringify(this.settings.secrets)
    );
  }
}

class SampleModal extends Modal {
  highlights: string;
  constructor(app: App, highlights: string) {
    super(app);
    this.highlights = highlights;
  }

  onOpen() {
    let { contentEl } = this;
    contentEl.setText(this.highlights);
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
