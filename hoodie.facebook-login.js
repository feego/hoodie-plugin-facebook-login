/* Hoodie plugin front-end API */
Hoodie.extend(function (hoodie) {
    'use strict';

    // Plugin contant values
    var APP_ID = 'APP_ID'

    // Facebook SDK initialization
    function initialize() {
        // Facebook initialization helper method, to be called after the SDK is loaded
        function initializeFacebook() {
            window.fbAsyncInit = function () {
                FB.init({
                    appId: APP_ID,
                    cookie: true,  // enable cookies to allow the server to access
                                   // the session
                    xfbml: true,  // parse social plugins on this page
                    version: 'v2.2' // use version 2.2
                })
            }
        }
        // Load the SDK asynchronously
        (function (d, s, id) {
            var js, root, fjs = d.getElementsByTagName(s)[0]
            if (d.getElementById(id)) return
            js = d.createElement(s)
            js.id = id
            js.onload = js.onreadystatechange = function() {
                js.onreadystatechange = js.onload = null
                initializeFacebook()
            }
            js.src = "//connect.facebook.net/en_US/sdk.js"
            root = d.createElement('div')
            root.id = 'fb-root'
            fjs.parentNode.insertBefore(js, fjs)
            fjs.parentNode.insertBefore(root, fjs)
        }(document, 'script', 'facebook-jssdk'))
    }
    function facebookLogin() {
        return new Promise(function (resolve, reject) {
            FB.login(function (response) {
                    if (response && response.status == 'connected') {
                        return resolve(response)
                    }
                    return reject(response)
                },
                {
                    scope: 'public_profile, email',
                    auth_type: 'rerequest'
                }
            )
        })
    }
    function facebookLogout() {
        FB.logout()
    }
    function globalLogin() {
        var userId = null,
            temporaryPassword = null

        // Only procceed if there's no opened session
        if (isSessionOpened()){
            return console.log("There's already an opened Facebook session.")
        }
        return facebookLogin()
            .then(function (response) {
                return hoodie.account.destroy().then(function() {
                    return hoodie.task.start('facebook-login-success', response)
                })
            })
            .then(function (response) {
                userId = response.authResponse.userID
                temporaryPassword = response.temporaryPassword
                return hoodie.account.signIn(userId, temporaryPassword)
            })
            .then(function (result) {
                console.log("Logged in successfully!")
            })
            .catch(function (error) {
                // User confirmation must take a while on signing up, so we try a second time
                // after 300ms
                setTimeout(function() {
                    hoodie.account.signIn(userId, temporaryPassword)
                        .then(function (result) {
                            console.log("Logged in successfully!")
                        })
                        .catch(function (error) {
                            console.error("Login error!", error)
                            globalLogout()
                            throw new Error(error)
                        })
                }, 300)
            })
    }
    function globalLogout() {
        if (isSessionOpened()) {
            facebookLogout()
        }
        return hoodie.account.signOut()
            .catch(function(error) {
                return hoodie.account.destroy()
            })
            .then(function(result) {
                console.log("Logged out successfully!")
            })
    }
    function isSessionOpened() {
        return FB.getAccessToken() != null
    }
    function getAccessToken() {
        return FB.getAccessToken()
    }

    initialize()

    // Extends Hoodie API
    hoodie.facebookSession = {
        logIn: globalLogin,
        logOut: globalLogout,
        isLogged: isSessionOpened,
        getAccessToken: getAccessToken
    }
});
