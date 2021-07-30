import { App, PluginSettingTab, Setting, Modal, Notice } from 'obsidian';
import Instapaper from './lib/integrations/instapaper';

import Clippings from './main';

export interface PluginSettings {}

export const DEFAULT_SETTINGS: PluginSettings = {};

export interface AllSettings {
  integrations: Record<string, any>;
  secrets: Record<string, any>;
  pluginSettings: PluginSettings;
}

export class ClippingsSettingsTab extends PluginSettingTab {
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
          el.createEl('pre', {
            text: this.plugin.getSecretsPath(),
          }),
          `  - make sure to add this file to your `,
          el.createEl('pre', {
            text: '.gitignore',
          }),
          ` if you are using Git with your vault!`
        );
      })
    );
    for (let integration of this.plugin.integrations) {
      integration.contributeSettings(containerEl, async () => {
        // TODO ergonimc settings savings
        const config = integration.getSettings();
        await this.plugin.saveSettings({});
      });
    }
  }
}
