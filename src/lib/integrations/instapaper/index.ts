import OAuth from 'oauth-1.0a';
import qs from 'query-string';
import crypto from 'crypto';

import { AuthInstapaper } from 'src/settings';
import request from 'src/lib/util/request';

const instapaper = 'https://www.instapaper.com';

export default class InstapaperAPI {
  private auth: AuthInstapaper;
  private client: OAuth;

  constructor(auth: AuthInstapaper) {
    this.auth = auth;
    this.client = new OAuth({
      consumer: {
        key: this.auth.consumerID,
        secret: this.auth.consumerSecret,
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

  private async request(endpoint: string, data?: any) {
    const req = {
      url: `${instapaper}${endpoint}`,
      method: 'POST',
      data: data ? JSON.stringify(data) : undefined,
      includeBodyHash: true,
    };
    const form = this.client.authorize(req, this.auth.accessToken);
    const header = this.client.toHeader(form);
    return request({
      url: req.url,
      method: 'POST', // all Instapaper APIs use POST
      headers: { Authorization: header.Authorization },
      body: req.data,
    });
  }

  async logIn(
    email: string,
    password: string
  ): Promise<{ key: string; secret: string }> {
    const resp = await this.request('/api/1/oauth/access_token', {
      x_auth_username: email,
      x_auth_password: password,
      x_auth_mode: 'client_auth',
    });

    const qline = qs.parse(resp);
    const accessToken = {
      key: qline['oauth_token'] as string,
      secret: qline['oauth_token_secret'] as string,
    };
    this.auth.accessToken = accessToken;
    return accessToken;
  }

  async verifyLogin() {
    const req = {
      url: `${instapaper}`,
      method: 'POST',
    };
    try {
      const resp = await this.request('/api/1/account/verify_credentials');
      console.log(resp);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}
