module.exports = test;

var debug = require('debug')('khulnasoft');
var Promise = require('es6-promise').Promise; // jshint ignore:line
var request = require('./request');
var fs = require('then-fs');
var protect = require('./protect');
var khulnasoft = require('..');

// important: this is different from ./config (which is the *user's* config)
var config = require('./config');

function test(root, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  if (!options) {
    options = {};
  }

  var hasDevDependencies = false;
  var promise = fs.exists(root).then(function (exists) {
    // if the file exists, let's read the package file and post
    // that up to the server.
    // if it doesn't, then we're assuming this is an existing
    // module on npm, so send the bare argument
    var payload = {
      url: config.API + '/vuln/npm',
      json: true,
      headers: {
        authorization: 'token ' + khulnasoft.api,
      },
    };

    var p = Promise.resolve();
    if (exists) {
      p = khulnasoft.modules(root, options).then(function (pkg) {
        hasDevDependencies = pkg.hasDevDependencies;
        payload.method = 'POST';
        payload.body = pkg;
        return payload;
      });
    } else {
      p = p.then(function () {
        payload.method = 'GET';
        payload.url += '/' + encodeURIComponent(root);
        return payload;
      });
    }

    return p.then(function (payload) {
      return new Promise(function (resolve, reject) {
        request(payload, function (error, res, body) {
          if (error) {
            return reject(error);
          }

          if (res.statusCode !== 200) {
            var err = new Error(body.error || res.statusCode);

            // this is the case where a local module has been tested, but
            // doesn't have any production deps, but we've noted that they
            // have dep deps, so we'll error with a more useful message
            if (res.statusCode === 404 && hasDevDependencies) {
              err.code = 'NOT_FOUND_HAS_DEV_DEPS';
            } else {
              err.code = res.statusCode;
            }

            return reject(err);
          }

          resolve(body);
        });
      });
    }).then(function (res) {
      return khulnasoft.dotfile.load(root).then(function (config) {
        if (!config.ignore || res.ok) {
          return res;
        }

        // strip the ignored modules from the results
        res.vulnerabilities = protect.filterIgnored(
          config.ignore,
          res.vulnerabilities
        );

        res.vulnerabilities = protect.filterPatched(
          config.patch,
          res.vulnerabilities
        );

        // if there's no vulns after the ignore process, let's reset the `ok`
        // state and remove the vulns entirely.
        if (res.vulnerabilities.length === 0) {
          res.ok = true;
          delete res.vulnerabilities;
        }

        return res;
      }, function (error) { // note: inline catch, to handle error from .load
        // the .khulnasoft file wasn't found, which is fine, so we'll return the vulns
        if (error.code === 'ENOENT') {
          return res;
        }
        throw error;
      });
    });
  });

  if (callback) {
    promise.then(function (res) {
      callback(null, res);
    }).catch(callback);
  }

  return promise;
}
