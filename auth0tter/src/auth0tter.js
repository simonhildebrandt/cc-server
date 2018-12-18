import auth0 from 'auth0-js'
import Emmett from 'emmett'

const auth_nonce = {state: 'something', nonce: 'other'};

export class Auth extends Emmett {

  constructor(config) {
    super()
    this.auth0 = new auth0.WebAuth(config)

    // Resolve, if we're an auth popup
    this.conclude();
  }

  setSession(authResult) {
    // Set the time that the Access Token will expire at
    let expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', expiresAt);
  }

  showLogin() {
    console.log('showing login')
    this.auth0.popup.authorize(auth_nonce, (err, authResult) => {
      if (err) {
        console.error('authorize failed', err)
      } else if (authResult) {
        this.loginComplete(authResult)
      }
    })
  }

  loginComplete(authResult) {
    this.setSession(authResult)
    this.emit('authenticated')
  }

  login() {
    this.renew(success => {
      if (!success) {
        this.showLogin()
      }
    });
  }

  renew(callback) {
    // Add production keys here
    // https://manage.auth0.com/#/connections/social
    // ...to get renew() working
    this.auth0.checkSession({}, (err, authResult) => {
      if (err) {
        console.error('checkSession failed', err)
        callback(false);
      } else if (authResult) {
        this.loginComplete(authResult)
        callback(true);
      } else {
        console.log('problem with checkSession');
      }
    })
  }

  conclude() {
    this.auth0.popup.callback(auth_nonce)
  }

  get token() {
    return localStorage.getItem('access_token')
  }

  get expiresAt() {
    const expiryString = localStorage.getItem('expires_at', '8640000000000000')
    const expiryEpoch = parseInt(expiryString, 10)
    return new Date(expiryEpoch)
  }

  get expired() {
    return this.expiresAt < new Date().getTime();
  }

  get gotToken() {
    return !!this.token && !this.expired
  }

  get activeToken() {
    return this.gotToken ? this.token : undefined;
  }

  logout() {
    // Clear Access Token and ID Token from local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    this.emit('deauthenticated')
  }
}
