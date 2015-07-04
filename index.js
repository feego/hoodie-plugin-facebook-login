/**
 *
 * Facebook login plugin for Hoodie
 */
var https = require('https')

// Plugin contant values
var APP_ID, APP_SECRET,
    APP_ACCESS_TOKEN = APP_ID + '|' + APP_SECRET,
    FACEBOOK_API_BASE_URL = 'graph.facebook.com'

function validateFacebookAccessToken(accessToken) {
    return new Promise(function (resolve, reject) {
        var path = '/debug_token?input_token=' + accessToken + '&access_token=' + APP_ACCESS_TOKEN,
            options = {
                host: FACEBOOK_API_BASE_URL,
                path: path,
                method: 'GET'
            }

        var request = https.request(options, function (response) {
            response.on('data', function (chunk) {
                var parsedResponse = JSON.parse(chunk)
                if (parsedResponse.data.is_valid) {
                    resolve(parsedResponse.data.user_id)
                } else {
                    reject('Invalid Facebook access token.')
                }
            })
        })
            .on('error', reject)
            .end()
    })
}
function findHoodieUser(hoodie, facebookUserId) {
    return new Promise(function (resolve, reject) {
        hoodie.account.find('user', facebookUserId, function (error, data) {
            if (error) {
                return reject(error)
            }
            return resolve(data)
        })
    })
}
function addHoodieUser(hoodie, userDocument) {
    return new Promise(function (resolve, reject) {
        hoodie.account.add('user', userDocument, function (error, data) {
            if (error) {
                return reject(error)
            }
            return resolve(data)
        })
    })
}
function createHoodieUser(hoodie, facebookUserId) {
    var uuid = Math.random().toString(36).slice(2, 9)
    var timeStamp = new Date()
    var userDocument = {
        id: facebookUserId,
        password: Math.random().toString(36).slice(2, 11),
        createdAt: timeStamp,
        updatedAt: timeStamp,
        signedUpAt: timeStamp,
        database: 'user/' + uuid,
        name: 'user/' + facebookUserId,
        hoodieId: uuid
    }
    // Creates Hoodie user
    return addHoodieUser(hoodie, userDocument)
        .then(function (result) {
            console.log("Facebook user", facebookUserId, "registered successfully.")
            return userDocument.password
        })
        .catch(function (error) {
            console.log("Error registering Facebook user", facebookUserId, "detail:", error)
        })
}
function updateHoodieUser(hoodie, facebookUserId) {
    return new Promise(function (resolve, reject) {
        var valuesToUpdate = {
            password: Math.random().toString(36).slice(2, 11)
        }
        // Set a new temporary password for the user on the client side to know
        hoodie.account.update('user', facebookUserId, valuesToUpdate, function (error, data) {
            if (error) {
                return reject(error)
            }
            return resolve(valuesToUpdate.password)
        });
    })
}
function addOrUpdateUserInHoodie(hoodie, facebookUserId) {
    return findHoodieUser(hoodie, facebookUserId)
        .then(function (data) {
            // Facebook user already registered in Hoodie
            return updateHoodieUser(hoodie, facebookUserId)
        })
        .catch(function (error) {
            // Facebook user not registered in Hoodie
            return createHoodieUser(hoodie, facebookUserId)
        })
}
// Plugin declaration
module.exports = function (hoodie, doneCallback) {
    APP_ID = hoodie.config.get("facebookLoginPlugin__appKey")
    APP_SECRET = hoodie.config.get("facebookLoginPlugin__appSecret")

    // Plugin initialization tasks
    hoodie.task.on('facebook-login-success:add', function (database, data) {
        if (data.authResponse) {
            return validateFacebookAccessToken(data.authResponse.accessToken)
                .then(function (validatedUserId) {
                    if (validatedUserId == data.authResponse.userID) {
                        return addOrUpdateUserInHoodie(hoodie, data.authResponse.userID)
                    } else {
                        throw new Error('Invalid Facebook access token.')
                    }
                })
                .then(function (temporaryPassword) {
                    data.temporaryPassword = temporaryPassword
                    return hoodie.task.success(database, data)
                })
        }
        return hoodie.task.error(database, data);
    })
    doneCallback();
};
