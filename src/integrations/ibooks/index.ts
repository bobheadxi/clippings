import { Notice, Plugin } from 'obsidian';

// see modules.d.ts
import qp from 'quoted-printable';
import utf8 from 'utf8';

import Integration from 'src/integrations/integration';
import { PluginSettings } from 'src/plugin/settings';

import parseReference from './parse';

export interface Secrets {}

export interface Settings {}

export default class IBooks extends Integration<Settings, Secrets> {
  static id = 'ibooks';
  getID() {
    return IBooks.id;
  }

  constructor(
    plugin: Plugin,
    pluginSettings: PluginSettings,
    integrationConfig: {
      settings: Settings;
      secrets: Secrets;
    }
  ) {
    super(plugin, pluginSettings, integrationConfig);

    plugin.addCommand({
      id: `${this.getID()}.import`,
      name: 'Import iBooks highlights from clipboards',
      callback: async () => {
        try {
          const contents = (await navigator.clipboard.read()).pop();
          const blob = await contents.getType('text/plain');
          let raw = await blob.text();
          // drop the random stuff before our HTML begins
          raw = '<html>' + raw.split('<html>', 2)[1];

          // decode the quoted-printed content
          const html = utf8.decode(qp.decode(raw));
          const doc = new DOMParser().parseFromString(html, 'text/html');

          const reference = parseReference(doc);
          console.log('Parsed reference', { reference });
          const notes = await this.importReferences([reference]);
          if (!notes) {
            new Notice('No notes imported');
          }
          new Notice(`Imported '${notes[0].name}'`);
        } catch (err) {
          new Notice(`Error occured on import: ${err}`);
        }
      },
    });
  }

  contributeSettings() {}
}
