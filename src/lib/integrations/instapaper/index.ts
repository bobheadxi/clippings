import OAuth from 'oauth-1.0a';
import qs from 'query-string';

const crypto = require('crypto');

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

  async logIn(
    email: string,
    password: string
  ): Promise<{ key: string; secret: string }> {
    const req = {
      url: `${instapaper}/api/1/oauth/access_token`,
      method: 'POST',
      data: {
        x_auth_username: email,
        x_auth_password: password,
        x_auth_mode: 'client_auth',
      },
    };

    const form = this.client.authorize({
      url: `${instapaper}/api/1/oauth/access_token`,
      method: 'POST',
      data: req.data,
      includeBodyHash: true,
    });
    const header = this.client.toHeader(form);
    const resp = await request({
      url: req.url,
      method: 'POST',
      headers: { Authorization: header.Authorization },
      body: JSON.stringify(req.data),
    });

    const qline = qs.parse(resp.data);
    const accessToken = {
      key: qline['oauth_token'] as string,
      secret: qline['oauth_token_secret'] as string,
    };
    this.auth.accessToken = accessToken;
    return accessToken;
  }

  async verifyLogin() {
    const req = {
      url: `${instapaper}/api/1/oauth/access_token`,
      method: 'POST',
    };
    const resp = await request({
      url: req.url,
      method: 'POST',
      headers: this.client.toHeader(
        this.client.authorize(req, this.auth.accessToken)
      ) as any,
    });
    console.log(resp.data);
  }
}
