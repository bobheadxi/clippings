import OAuth from 'oauth-1.0a';
import qs from 'query-string';

const crypto = require('crypto');

import { AuthInstapaper } from 'src/settings';

const instapaper = 'https://instapaper.com';

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
    };
    return new Promise((resolve, reject) => {
      ajax({
        url: req.url,
        method: 'POST',
        headers: this.client.toHeader(this.client.authorize(req)) as any,
        data: {
          x_auth_username: email,
          x_auth_password: password,
          x_auth_mode: 'client_auth',
        },
        withCredentials: true,
        success: (resp) => {
          const qline = qs.parse(resp);
          const accessToken = {
            key: qline['oauth_token'] as string,
            secret: qline['oauth_token_secret'] as string,
          };
          this.auth.accessToken = accessToken;
          resolve(accessToken);
        },
        error: (err) => reject(err),
      });
    });
  }

  async verifyLogin() {
    const request = {
      url: `${instapaper}/api/1/oauth/access_token`,
      method: 'POST',
    };
    return new Promise((resolve, reject) => {
      ajax({
        url: request.url,
        method: 'POST',
        headers: this.client.toHeader(
          this.client.authorize(request, this.auth.accessToken)
        ) as any,
        withCredentials: true,
        success: (resp) => resolve(resp),
        error: (err) => reject(err),
      });
    });
  }
}
