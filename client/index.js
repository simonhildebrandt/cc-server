import auth0 from 'auth0-js'
import Emmett from 'emmett'
import shoe from 'shoe'


class Client {
  constructor() {
    this.stream = shoe('http://localhost:9999/sub')
    this.stream.on('connect', () => {
      this.connected = true
    })
  }

  notify() {
    console.log('sending', window.auth.token)
    this.stream.write(JSON.stringify({auth: window.auth.token}))
  }
}

export default class Auth extends Emmett {

  constructor() {
    super()

    this.auth0 = new auth0.WebAuth({
      domain: 'clockcamera.au.auth0.com',
      clientID: 'Rc2vG1XNsWaQQDOQgzJ31DrUqAFxNool',
      redirectUri: 'http://localhost:9000/close.html',
      audience: 'CCServerDev', //https://clockcamera.au.auth0.com/userinfo',
      responseType: 'token id_token',
      scope: 'openid'
    })

    //this.parseLoginReturn()
  }
  //
  // parseLoginReturn() {
  //   this.auth0.parseHash((err, authResult) => {
  //     if (authResult && authResult.accessToken && authResult.idToken) {
  //       this.setSession(authResult);
  //       this.emit('authenticated')
  //     } else if (err) {
  //       console.error(err);
  //     }
  //   })
  // }

  setSession(authResult) {
    // Set the time that the Access Token will expire at
    let expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', expiresAt);
  }

  login() {
    this.auth0.popup.authorize({state: 'something', nonce: 'other'}, (err, authResult) => {
      if (err) {
        console.error(err)
      } else if (authResult) {
        this.setSession(authResult)
        this.emit('authenticated')
      }
    })
  }

  conclude() {
    this.auth0.popup.callback({state: 'something', nonce: 'other'})
  }

  get token() {
    return localStorage.getItem('access_token')
  }

  loggedIn() {
    return !!this.token
  }

  logout() {
    // Clear Access Token and ID Token from local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    this.emit('deauthenticated')
  }
}

window.auth = new Auth()

var button = document.getElementById('login')
var client = new Client()

window.boot = function() {
  button.addEventListener('click', (event) => {
    if (window.auth.loggedIn()) {
      window.auth.logout()
    } else {
      window.auth.login()
    }
  })

  if (window.auth.loggedIn()) {
    button.innerHTML = 'logout'
  } else {
    button.innerHTML = 'login'
  }

  window.auth.on('authenticated', () => {
    button.innerHTML = 'logout'
  })

  window.auth.on('deauthenticated', () => {
    button.innerHTML = 'login'
  })

  if (window.auth.loggedIn()){
    client.notify()
  }
}

window.conclude = function() {
  console.log('concluding')
  window.auth.conclude()
}
