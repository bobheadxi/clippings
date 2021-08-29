import { App, Setting, Modal, Notice } from 'obsidian';

export type Credentials = { username?: string; password?: string };

/**
 * A login modal for Integrations requiring credentials.
 *
 * Do not instantiate this directly - use Integration.createLoginModal
 */
export class LoginModal extends Modal {
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
