import { Setting } from 'obsidian';

import Integration from 'src/lib/integrations/integration';

export default class Markdown extends Integration<{}, {}> {
  static id = 'markdown';
  getID() {
    return Markdown.id;
  }

  contributeToPlugin() {}

  contributeSettings(settings: HTMLElement) {
    settings.createEl('h3', { text: 'Markdown' });
    new Setting(settings)
      .setName('Import lists as quotes')
      .addToggle((toggle) => {
        toggle.setDisabled(true); // TODO
        toggle.setTooltip('WIP');
      });
    new Setting(settings).setName('Import comments').addToggle((toggle) => {
      toggle.setDisabled(true); // TODO
      toggle.setTooltip('WIP');
    });
  }
}
