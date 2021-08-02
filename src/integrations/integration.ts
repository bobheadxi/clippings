import { App, Setting, Modal, Notice, Plugin } from 'obsidian';
import { PluginSettings as PluginSettings } from 'src/settings';

/**
 * Integrations should extend this class and be added to `integrationsRegistry` to be loaded.
 */
export default abstract class Integration<
  IntegrationSettingsT,
  IntegrationsSecretsT
> {
  private plugin: Plugin;

  /**
   * This ID must also be available as `static id = 'my-id'` on each Integration.
   *
   * Static abstract is not supported by TypeScript: https://github.com/microsoft/TypeScript/issues/34516
   */
  abstract getID(): string;

  /**
   * Plugin-wide configuration.
   */
  protected pluginSettings: PluginSettings;

  /**
   * Integration settings.
   */
  protected settings: IntegrationSettingsT;
  /**
   * Integration secrets.
   */
  protected secrets: IntegrationsSecretsT;

  constructor(
    plugin: Plugin,
    pluginSettings: PluginSettings,
    integrationConfig: {
      settings: IntegrationSettingsT;
      secrets: IntegrationsSecretsT;
    }
  ) {
    this.plugin = plugin;
    this.pluginSettings = pluginSettings || {};
    this.settings = integrationConfig.settings;
    this.secrets = integrationConfig.secrets;
  }

  abstract contributeSettings(
    settings: HTMLElement,
    saveSettings: () => Promise<void>
  ): void;

  getSettings() {
    return {
      settings: this.settings,
      secrets: this.secrets,
    };
  }

  protected createLoginModal(
    title: string,
    description: string,
    loginCallback: (credentials: Credentials) => Promise<void>,
    onClose?: (success: boolean) => void
  ): LoginModal {
    return new LoginModal(
      this.plugin.app,
      title,
      description,
      loginCallback,
      onClose
    );
  }
}

type Credentials = { username?: string; password?: string };

class LoginModal extends Modal {
  title: string;
  description: string;
  private credentials: Credentials;
  private loginCallback: (credentials: Credentials) => Promise<void>;
  private onCloseCallback: (success: boolean) => void;
  success: boolean;

  constructor(
    app: App,
    title: string,
    description: string,
    loginCallback: (credentials: Credentials) => Promise<void>,
    onClose?: (success: boolean) => void
  ) {
    super(app);
    this.title = title;
    this.description = description;
    this.loginCallback = loginCallback;
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
          await this.loginCallback(this.credentials);
          this.success = true;
          new Notice('Log in successful!', 8000);
          this.close();
        } catch (err) {
          console.error('Login failed', err);
          new Notice(
            'Failed to log in to Instapaper: ' +
              JSON.stringify(err, Object.getOwnPropertyNames(err)),
            8000
          );
        }
      });
    });
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
    this.onCloseCallback(this.success);
  }
}
