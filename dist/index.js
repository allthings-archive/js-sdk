'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var rest = _interopDefault(require('rest'));
var mime = _interopDefault(require('rest/interceptor/mime'));
var params = _interopDefault(require('rest/interceptor/params'));
var errorCode = _interopDefault(require('rest/interceptor/errorCode'));
var timeout = _interopDefault(require('rest/interceptor/timeout'));
var interceptor = _interopDefault(require('rest/interceptor'));
var UrlBuilder = _interopDefault(require('rest/UrlBuilder'));
var parse = _interopDefault(require('url-parse'));

function isAuthPath(pathname) {
  return (/^\/?auth/.test(pathname)
  );
}

function startsWith(str, prefix) {
  return str.indexOf(prefix) === 0;
}

function endsWith(str, suffix) {
  return str.lastIndexOf(suffix) + suffix.length === str.length;
}

// Extended standard `prefix` interceptor
var pathPrefix = interceptor({
  request: function request(_request, config) {
    if (!new UrlBuilder(_request.path).isFullyQualified()) {
      var prefixPath = isAuthPath(_request.path) ? config.authHost : config.apiHost;

      if (_request.path) {
        if (!endsWith(prefixPath, '/') && !startsWith(_request.path, '/')) {
          prefixPath += '/';
        } else if (endsWith(prefixPath, '/') && startsWith(_request.path, '/')) {
          prefixPath = prefixPath.slice(0, -1);
        }
        prefixPath += _request.path;
      }
      _request.path = prefixPath;
    }

    return _request;
  }
});

var withCredentials = interceptor({
  request: function request(_request) {
    if (isAuthPath(_request.path)) _request.withCredentials = true;

    return _request;
  }
});

function updateHeaders(request, accessToken) {
  var headers = void 0;

  headers = request.headers || (request.headers = {});
  headers.Authorization = 'Bearer ' + accessToken;

  return headers;
}

function needsAccessToken(pathname) {
  return (/^\/*auth\/(?!logout).*$/i.test(pathname) === false && /api\/v1\/helpers\//i.test(pathname) === false
  );
}

function isAccessTokenRequest(pathname) {
  return (/^\/*auth\/(access-token|login|oauth-login|password-reset\/[A-Za-z0-9]*)$/i.test(pathname)
  );
}

var accessToken = interceptor({
  init: function init(config) {
    config.onAccessToken = config.onAccessToken || function (f) {
      return f;
    };
    return config;
  },
  request: function request(_request, config) {
    var _parse = parse(_request.path);

    var pathname = _parse.pathname;


    if (needsAccessToken(pathname) === true) {
      _request.headers = updateHeaders(_request, _request.accessToken || config.token);
    }

    return _request;
  },
  response: function response(_response, config, meta) {
    var _parse2 = parse(_response.request.path);

    var pathname = _parse2.pathname;

    if (isAccessTokenRequest(pathname) && _response.status && _response.status.code === 200 && _response.entity.access_token) {
      config.onAccessToken(_response.entity.access_token);
    }

    return _response;
  }
});

var clientIdInterceptor = interceptor({

  request: function request(_request, config) {
    var params = _request.params || {};
    var clientId = config.clientId;
    var requestId = _request.client_id || _request.clientId || _request.clientID;
    if (requestId && typeof requestId === 'string') {
      clientId = requestId;
    }

    if (_request.clientId) {
      params.clientId = clientId;
      _request.params = params;
    }

    if (_request.clientID) {
      params.clientID = clientId;
      _request.params = params;
    }

    if (_request.client_id) {
      params.client_id = clientId;
      _request.params = params;
    }

    return _request;
  }
});

var csrf = interceptor({
  request: function request(_request, config, meta) {
    if (_request.requiresCsrf) {
      var client = config.client || _request.originator || client.skip();
      return client({
        path: config.path,
        accessToken: false,
        clientID: true,
        method: 'GET'
      }).then(function (response) {
        _request.entity = _request.entity || {};
        _request.entity.csrfToken = response.entity.csrfToken;

        return _request;
      });
    }
    return _request;
  }
});

function login(email, password) {
  return {
    method: 'POST',
    path: 'auth/login',
    requiresCsrf: true,
    clientID: true,
    entity: {
      email: email,
      password: password
    }
  };
}

function localeHelper() {
  return {
    method: 'GET',
    path: 'api/v1/helpers/locale',
    clientID: true
  };
}

function accessToken$1() {
  return {
    method: 'GET',
    path: 'auth/access-token',
    clientID: true
  };
}

var requests = null;

var _requests = Object.freeze({
  login: login,
  localeHelper: localeHelper,
  accessToken: accessToken$1,
  default: requests
});

var index = (function (authHost, apiHost, clientId) {
  return rest.wrap(withCredentials).wrap(mime, { mime: 'application/json' }).wrap(accessToken).wrap(params).wrap(clientIdInterceptor, { clientId: clientId }).wrap(csrf, { path: 'auth/csrf-token' }).wrap(pathPrefix, { authHost: authHost, apiHost: apiHost }).wrap(errorCode, { code: 500 }).wrap(timeout, { timeout: 5000 });
});

exports['default'] = index;
exports.requests = _requests;