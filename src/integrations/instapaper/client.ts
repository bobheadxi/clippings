import OAuth from 'oauth-1.0a';
import qs from 'query-string';
import crypto from 'crypto';

import request from 'src/lib/request';
import { Secrets } from '.';

const instapaper = 'https://www.instapaper.com';

export default class InstapaperClient {
  private client: OAuth;
  private accessToken?: OAuth.Token;

  constructor(secrets: Secrets) {
    this.accessToken = secrets.accessToken;
    this.client = new OAuth({
      consumer: {
        key: secrets.consumerID,
        secret: secrets.consumerSecret,
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto
          .createHmac('sha1', key)
          .update(base_string)
          .digest('base64');
      },
    });
  }

  private async instapaperRequest(endpoint: string, data: any = {}) {
    const req = {
      url: `${instapaper}/api/1/${endpoint}`,
      method: 'POST', // all Instapaper APIs use POST,
      data,
    };
    const formAuth = this.client.authorize(req, this.accessToken);
    return await request({
      url: req.url,
      method: req.method,
      // TODO: renable if Obsidian supports headers
      // headers: { ...this.client.toHeader(formAuth) },
      body: qs.stringify(formAuth),
    });
  }

  async logIn(
    email: string,
    password: string
  ): Promise<{ key: string; secret: string }> {
    const resp = await this.instapaperRequest('oauth/access_token', {
      x_auth_username: email,
      x_auth_password: password,
      x_auth_mode: 'client_auth',
    });
    console.log(resp);

    const qline = qs.parse(resp);
    const accessToken = {
      key: qline['oauth_token'] as string,
      secret: qline['oauth_token_secret'] as string,
    };
    if (!accessToken.key || !accessToken.secret) {
      throw new Error('Login failed: ' + resp);
    }

    return accessToken;
  }

  async verifyLogin() {
    try {
      const resp = await this.instapaperRequest('account/verify_credentials');
      console.log('Verify login response', resp);
      return true;
    } catch (err) {
      console.warn('Failed to verify login', err);
      return false;
    }
  }

  async listBookmarks() {
    try {
      const resp = await this.instapaperRequest('bookmarks/list', { limit: 1 });
      console.log('Bookmarks', resp);
      return true;
    } catch (err) {
      console.error('Failed to list');
      return false;
    }
  }
}
