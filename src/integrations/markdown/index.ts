import { Setting, Plugin, Notice } from 'obsidian';

import Integration from 'src/integrations/integration';
import { PluginSettings } from 'src/settings';

import importReferenceNotes from './import';

type Settings = {
  replaceImportedNoteContents?: boolean;
};

export default class Markdown extends Integration<Settings, {}> {
  static id = 'markdown';
  getID() {
    return Markdown.id;
  }

  constructor(
    plugin: Plugin,
    pluginSettings: PluginSettings,
    integrationConfig: {
      settings: Settings;
      secrets: {};
    }
  ) {
    super(plugin, pluginSettings, integrationConfig);
    const app = plugin.app;

    plugin.addCommand({
      id: 'markdown.import',
      name: 'Import note as highlights',
      callback: async () => {
        const file = app.workspace.getActiveFile();
        if (!file) {
          new Notice('No file selected for import!');
          return;
        }

        try {
          new Notice(`Starting import of highlights in '${file.path}'...`);
          const generatedNotes = await importReferenceNotes(
            app,
            file,
            this.pluginSettings
          );
          const summary =
            generatedNotes.length > 1
              ? generatedNotes.map((g) => `- ${g}`).join('\n')
              : generatedNotes[0];
          if (this.settings.replaceImportedNoteContents) {
            await app.vault.modify(file, summary);
          } else {
            const existing = await app.vault.read(file);
            await app.vault.modify(file, summary + '\n\n---\n\n' + existing);
          }
          new Notice(`${generatedNotes.length} note(s) generated:\n${summary}`);
        } catch (err) {
          console.error(err);
          new Notice(`Clippings import failed, sorry! ${err}`);
        }
      },
    });
  }

  contributeSettings(settings: HTMLElement, save: () => Promise<void>) {
    settings.createEl('h3', { text: 'Markdown' });
    new Setting(settings)
      .setName('Replace imported note contents')
      .addToggle(async (toggle) => {
        if (this.settings.replaceImportedNoteContents == null) {
          this.settings.replaceImportedNoteContents = true;
          await save();
        }
        toggle.setValue(this.settings.replaceImportedNoteContents);

        toggle.onChange(async (value) => {
          this.settings.replaceImportedNoteContents = value;
          await save();
        });
      });
  }
}
