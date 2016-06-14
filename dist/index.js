'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var rest = _interopDefault(require('rest'));
var mime = _interopDefault(require('rest/interceptor/mime'));
var errorCode = _interopDefault(require('rest/interceptor/errorCode'));
var defaultRequest = _interopDefault(require('rest/interceptor/defaultRequest'));
var pathPrefix = _interopDefault(require('rest/interceptor/pathPrefix'));
var interceptor = _interopDefault(require('rest/interceptor'));

var accessToken = interceptor({

  request: function request(_request, config) {
    var headers = void 0;
    headers = _request.headers || (_request.headers = {});
    headers.authorization = 'Bearer ' + (_request.bearerToken || config.bearerToken);

    return _request;
  }
});

function getToken(response) {
  return response.entity.csrfToken;
}

var csrf = interceptor({
  init: function init(config) {
    // do studd with the config
    return config;
  },
  request: function request(_request, config, meta) {
    if (_request.requiresCsrf) {
      var client = config.client || _request.originator || client.skip();

      return client({
        path: config.path,
        clientID: true,
        method: 'GET'
      }).then(function (response) {
        return {
          csrfToken: getToken(response)
        };
      }).then(function (response) {
        var entity = JSON.parse(_request.entity) || {};
        entity.csrfToken = response.csrfToken;
        _request.entity = JSON.stringify(entity);

        return _request;
      });
    }

    return _request;
  },
  response: function response(_response, config, meta) {
    return _response;
  },
  success: function success(response, config, meta) {
    return response;
  },
  error: function error(response, config, meta) {
    return response;
  }
});

var clientIdInterceptor = interceptor({

  request: function request(_request, config) {
    var params = _request.params || {};

    if (_request.clientId) {
      params.clientId = config.clientId;
      _request.params = params;
    }

    if (_request.clientID) {
      params.clientID = config.clientId;
      _request.params = params;
    }

    if (_request.client_id) {
      params.client_id = config.clientId;
      _request.params = params;
    }

    return _request;
  }
});

var auth = function auth(_ref) {
  var path = _ref.path;
  var clientId = _ref.clientId;

  return rest.wrap(defaultRequest, { mixin: { withCredentials: true } }).wrap(clientIdInterceptor, { clientId: clientId }).wrap(csrf, { path: path + 'csrf-token' }).wrap(pathPrefix, { prefix: path }).wrap(mime, { mime: 'application/json' }).wrap(errorCode, { code: 400 });
};

var api = function api(_ref2) {
  var path = _ref2.path;
  var token = _ref2.token;

  return rest.wrap(defaultRequest).wrap(pathPrefix, { prefix: path }).wrap(mime, { mime: 'application/json' }).wrap(errorCode, { code: 400 }).wrap(accessToken, { bearerToken: token });
};

var index = {
  api: api,
  auth: auth
};

module.exports = index;