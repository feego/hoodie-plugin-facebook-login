# Hoodie Facebook Login Plugin

> Use Facebook credentials to login into your hoodie app.

#### Installation

```bash
hoodie install facebook-login
```

After installing the plugin, you must configure it using your Facebook App configuration keys. You need to do this both for the plugin's front-end and backend code. To setup the keys for the plugin's backend, you can use the plugin's admin dashboard. However, the plugin's front-end configuration have to be done directly in the plugin's front-end API code, in the line 6 of the file "hoodie.facebook-login.js":

```js
// Plugin contant values
var APP_ID = 'APP_ID'
```

#### Front-end API

```js
// sign in
hoodie.facebookSession.logIn()
// sign out
hoodie.facebookSession.logOut()
// check if there's an opened session
hoodie.facebookSession.isLogged()
// get current Facebook Access Token
hoodie.facebookSession.getAccessToken()
```

#### License

The MIT License (MIT)

Copyright (c) 2015 GlazedSolutions