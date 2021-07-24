import { App, PluginSettingTab, Setting, Modal, Notice } from 'obsidian';
import InstapaperAPI from './lib/integrations/instapaper';

import Clippings from './main';

export interface AuthInstapaper {
  consumerID?: string;
  consumerSecret?: string;
  accessToken?: { key: string; secret: string };
}

export interface IntegrationInstapaper {}

export interface ClippingsSettings {
  integrations: {};
  secrets: {
    instapaper: AuthInstapaper;
  };
}

export const DEFAULT_SETTINGS: ClippingsSettings = {
  integrations: {},
  secrets: { instapaper: {} },
};

export class ClippingsSettingsTab extends PluginSettingTab {
  plugin: Clippings;

  constructor(app: App, plugin: Clippings) {
    super(app, plugin);
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
    containerEl.createEl('p', {
      text: 'Secrets (for authentication) are stored in `.obsidian/clippings-secrets.json` - make sure to add this file to your `.gitignore` if you are using Git with your vault!',
    });
    // Markdown integration
    {
      containerEl.createEl('h3', { text: 'Markdown' });
      new Setting(containerEl)
        .setName('Import lists as quotes')
        .addToggle((toggle) => {
          toggle.setDisabled(true); // TODO
          toggle.setTooltip('WIP');
        });
      new Setting(containerEl)
        .setName('Import comments')
        .addToggle((toggle) => {
          toggle.setDisabled(true); // TODO
          toggle.setTooltip('WIP');
        });
    }
    // Instapaper integration
    {
      containerEl.createEl('h3', { text: 'Instapaper' });
      new Setting(containerEl)
        .setName('OAuth application')
        .setDesc(
          createFragment((el) => {
            el.append(
              `Sync with Instapaper by providing OAuth tokens for an `,
              el.createEl('a', {
                href: 'https://www.instapaper.com/main/request_OAuth_consumer_token',
                text: 'Instapaper OAuth application',
              }),
              `.`
            );
          })
        )
        .addText((text) =>
          text
            .setPlaceholder('OAuth consumer ID')
            .setValue(
              '*'.repeat(
                this.plugin.settings.secrets.instapaper.consumerID?.length
              )
            )
            .onChange(async (value) => {
              this.plugin.settings.secrets.instapaper.consumerID = value;
              await this.plugin.saveSettings();
            })
        )
        .addText((text) =>
          text
            .setPlaceholder('OAuth consumer secret')
            .setValue(
              '*'.repeat(
                this.plugin.settings.secrets.instapaper.consumerSecret?.length
              )
            )
            .onChange(async (value) => {
              this.plugin.settings.secrets.instapaper.consumerSecret = value;
              await this.plugin.saveSettings();
            })
        );
      new Setting(containerEl)
        .setName('Log in with OAuth application')
        .addToggle(async (toggle) => {
          toggle.setValue(
            !!this.plugin.settings.secrets.instapaper.accessToken
          );
          toggle.disabled =
            !this.plugin.settings.secrets.instapaper.consumerSecret ||
            !this.plugin.settings.secrets.instapaper.consumerID;
          if (toggle.disabled) {
            toggle.setTooltip(
              'OAuth application credentials must be set before logging in!'
            );
          } else if (this.plugin.settings.secrets.instapaper.accessToken) {
            const loggedIn = await new InstapaperAPI(
              this.plugin.settings.secrets.instapaper
            ).verifyLogin();
            if (loggedIn) {
              toggle.setTooltip('Login success!');
            } else {
              toggle.setTooltip(
                'Authentication is set up, but login verification failed - please try logging in again!'
              );
              new Notice(
                'Clippy and Instapaper integration failed to connect - please try logging in again!',
                8000
              );
            }
          }

          toggle.onChange(async (value) => {
            if (!value) {
              // Log out of account
              this.plugin.settings.secrets.instapaper.accessToken = null;
              await this.plugin.saveSettings();
            } else {
              // log in
              new LoginModal(
                this.app,
                'Integrate with Instapaper',
                'Log in with your Instapaper account.',
                async (credentials) => {
                  try {
                    const instapaper = new InstapaperAPI(
                      this.plugin.settings.secrets.instapaper
                    );
                    const token = await instapaper.logIn(
                      credentials.username,
                      credentials.password
                    );
                    this.plugin.settings.secrets.instapaper.accessToken = token;
                    await this.plugin.saveSettings();
                    await instapaper.verifyLogin();
                  } catch (err) {
                    toggle.setValue(false);
                    throw err;
                  }
                },
                (success: boolean) => {
                  toggle.setValue(success);
                }
              ).open();
            }
          });
        });
    }
  }
}

type Credentials = { username?: string; password?: string };

class LoginModal extends Modal {
  title: string;
  description: string;
  private credentials: Credentials;
  private callback: (credentials: Credentials) => Promise<void>;
  private onCloseCallback: (success: boolean) => void;
  success: boolean;

  constructor(
    app: App,
    title: string,
    description: string,
    callback: (credentials: Credentials) => Promise<void>,
    onClose?: (success: boolean) => void
  ) {
    super(app);
    this.title = title;
    this.description = description;
    this.callback = callback;
    this.credentials = {};
    this.onCloseCallback = onClose;
  }

  onOpen() {
    let { contentEl } = this;

    contentEl.createEl('h1', { text: this.title });
    contentEl.createEl('p', { text: this.description });

    new Setting(contentEl)
      .setName('Email')
      .addText((text) =>
        text.onChange((value) => (this.credentials.username = value))
      );
    new Setting(contentEl)
      .setName('Password')
      .addText((text) =>
        text.onChange((value) => (this.credentials.password = value))
      );
    new Setting(contentEl).addButton((button) => {
      button.setButtonText('Log in');
      button.onClick(async () => {
        try {
          await this.callback(this.credentials);
          this.success = true;
          new Notice('Log in successful!', 8000);
        } catch (err) {
          console.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
          new Notice(
            'Failed to log in to Instapaper: ' +
              JSON.stringify(err, Object.getOwnPropertyNames(err)),
            8000
          );
        }
        this.close();
      });
    });
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
    this.onCloseCallback(this.success);
  }
}
