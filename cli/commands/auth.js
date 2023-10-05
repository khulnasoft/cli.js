module.exports = auth;

var Promise = require('es6-promise').Promise; // jshint ignore:line
var debug = require('debug')('khulnasoft');
var open = require('open');
var khulnasoft = require('../../lib/');
var config = require('../../lib/config');
var request = require('../../lib/request');
var url = require('url');
var uuid = require('node-uuid');
var makeSpinner = require('../../lib/spinner');

var apiUrl = url.parse(config.API);
var authUrl = apiUrl.protocol + '//' + apiUrl.host;

function githubAuth() {
  var token = uuid.v4(); // generate a random key

  var url = authUrl + '/login?token=' + token;

  var msg =
    '\nNow redirecting you to our github auth page, go ahead and log in,\n' +
    'and once the auth is complete, return to this prompt and you\'ll\n' +
    'be ready to start using khulnasoft.\n\nIf you can\'t wait use this url:\n' +
    url + '\n';

  console.log(msg);

  var spinner = makeSpinner('Waiting...');

  return new Promise(function (resolve) {
    setTimeout(function () {
      open(url);
    }, 2000);
    // start checking the token immediately in case they've already
    // opened the url manually
    resolve(testAuthComplete(token).then(function (res) {
      spinner.clear();
      return res;
    }));
  });
}

function testAuthComplete(token) {
  var payload = {
    body: {
      token: token,
    },
    url: config.API + '/verify/callback',
    json: true,
    method: 'post',
  };

  return new Promise(function (resolve, reject) {
    debug(payload);
    request(payload, function (error, res, body) {
      debug(error, (res || {}).statusCode, body);
      if (error) {
        return reject(error);
      }


      if (res.statusCode !== 200) {
        var e = new Error(body.message);
        e.code = res.statusCode;
        return reject(e);
      }

      // we have success
      if (body.api) {
        return resolve({
          res: res,
          body: body,
        });
      }

      // we need to wait and poll again in a moment
      setTimeout(function () {
        resolve(testAuthComplete(token));
      }, 1000);
    });
  });
}

function verifyAPI(api) {
  var payload = {
    body: {
      api: api,
    },
    method: 'POST',
    url: config.API + '/verify/token',
    json: true,
  };

  return new Promise(function (resolve, reject) {
    request(payload, function (error, res, body) {
      if (error) {
        return reject(error);
      }

      resolve({
        res: res,
        body: body,
      });
    });
  });
}

function auth(api) {
  var promise;
  if (api) {
    // user is manually setting the API key on the CLI - let's trust them
    promise = verifyAPI(api);
  } else {
    promise = githubAuth();
  }

  return promise.then(function (data) {
    var res = data.res;
    var body = res.body;
    debug(body);

    if (res.statusCode === 200 || res.statusCode === 201) {
      khulnasoft.config.set('api', body.api);
      return '\nYour account has been authenticated. Khulnasoft is now ready to ' +
        'be used.\n';
    } else if (body.message) {
      var error = new Error(body.message);
      error.code = res.statusCode;
      throw error;
    } else {
      throw new Error('authfail');
    }
  });
}
