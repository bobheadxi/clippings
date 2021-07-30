import OAuth from 'oauth-1.0a';
import qs from 'query-string';
import crypto from 'crypto';
import { App, Setting, Notice, Plugin } from 'obsidian';

import request from 'src/lib/util/request';
import Integration from 'src/lib/integrations';
import { PluginSettings } from 'src/settings';
import InstapaperClient from './client';

const instapaper = 'https://www.instapaper.com';

export interface Secrets {
  consumerID?: string;
  consumerSecret?: string;
  accessToken?: { key: string; secret: string };
}

export interface Settings {}

export default class Instapaper extends Integration<Settings, Secrets> {
  static id = 'instapaper';

  constructor(
    app: App,
    pluginSettings: PluginSettings,
    integration: {
      settings: Settings;
      secrets: Secrets;
    }
  ) {
    super(app, pluginSettings, integration);
  }

  contributeToPlugin(plugin: Plugin) {
    // TODO
  }

  contributeSettings(settings: HTMLElement) {
    settings.createEl('h3', { text: 'Instapaper' });
    new Setting(settings)
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
          .setValue('*'.repeat(this.secrets.consumerID?.length))
          .onChange(async (value) => {
            this.secrets.consumerID = value;
          })
      )
      .addText((text) =>
        text
          .setPlaceholder('OAuth consumer secret')
          .setValue('*'.repeat(this.secrets.consumerSecret?.length))
          .onChange(async (value) => {
            this.secrets.consumerSecret = value;
          })
      );
    new Setting(settings)
      .setName('Log in with OAuth application')
      .addToggle(async (toggle) => {
        toggle.setValue(!!this.secrets.accessToken);
        toggle.disabled =
          !this.secrets.consumerSecret || !this.secrets.consumerID;
        if (toggle.disabled) {
          toggle.setTooltip(
            'OAuth application credentials must be set before logging in!'
          );
        } else if (this.secrets.accessToken) {
          const loggedIn = await new InstapaperClient(
            this.secrets,
            this.settings
          ).listBookmarks();

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
            this.secrets.accessToken = null;
            toggle.setTooltip('Account logged out.');
          } else {
            // log in
            this.createLoginModal(
              'Integrate with Instapaper',
              'Log in with your Instapaper account.',
              async (credentials) => {
                try {
                  const token = await new InstapaperClient(
                    this.secrets,
                    this.settings
                  ).logIn(credentials.username, credentials.password);
                  this.secrets.accessToken = token;
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
