'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _rest = _interopDefault(require('rest'));
var _mime = _interopDefault(require('rest/interceptor/mime'));
var _errorCode = _interopDefault(require('rest/interceptor/errorCode'));
var interceptor = _interopDefault(require('rest/interceptor'));
var when = _interopDefault(require('when'));
var parse = _interopDefault(require('url-parse'));
var UrlBuilder = _interopDefault(require('rest/UrlBuilder'));

var accessTokens = {};

var initAccessTokenSession = function initAccessTokenSession(uuid, accessToken) {
  accessTokens[uuid] = when.promise(function (resolve) {
    resolve(accessToken);
  });
};

var killAccessTokenSession = function killAccessTokenSession(uuid) {
  delete accessTokens[uuid];
};

var session = {
  accessTokens: accessTokens,
  initAccessTokenSession: initAccessTokenSession,
  killAccessTokenSession: killAccessTokenSession
};

var noSSR = 'singleClient';

function getAccessToken(authHost, clientId, uuid, renew, cookies, callback, err) {
  if (!session.accessTokens.hasOwnProperty(uuid) || renew) {
    session.accessTokens[uuid] = when.promise(function (resolve, reject) {
      var host = authHost.replace(/\/$/, '');

      var params = {
        method: 'GET',
        path: host + '/auth/access-token',
        params: { client_id: clientId },
        withCredentials: true
      };

      if (cookies !== null) {
        params.headers = { Cookie: cookies };
      }

      _rest(params).then(function (response) {
        if (response.status.code === 200) {
          var token = JSON.parse(response.entity).access_token;
          resolve(token);
          callback(token);
        } else {
          err(response);
        }
      });
    });
  }

  return session.accessTokens[uuid];
}

function updateHeaders(request, accessToken) {
  var headers = void 0;

  headers = request.headers || (request.headers = {});
  headers.Authorization = 'Bearer ' + accessToken;
}

function getClientId(request, config) {
  var params = request.params;

  if (params && (params.client_id || params.clientId || params.clientID)) {
    return params.client_id || params.clientId || params.clientID;
  } else {
    return config.clientId;
  }
}

function needsAccessToken(pathname) {
  return (/^\/*auth\/(?!logout).*$/i.test(pathname) === false
  );
}

function isAccessTokenRequest(pathname) {
  return (/^\/*auth\/(access-token|login|password-reset\/[A-Za-z0-9]*)$/i.test(pathname)
  );
}

var _accessToken = interceptor({
  request: function request(_request, config) {
    var _parse = parse(_request.path);

    var pathname = _parse.pathname;

    var newRequest = void 0,
        triggerAbort = void 0;

    var abort = new Promise(function (resolve, reject) {
      triggerAbort = reject;
    });

    if (needsAccessToken(pathname) === true) {
      newRequest = getAccessToken(config.authHost, getClientId(_request, config), config.uuid || noSSR, false, config.cookies, config.callback, triggerAbort).then(function (accessToken) {
        if (!accessToken) throw new Error('Empty access-token provided!');
        updateHeaders(_request, accessToken);
        return _request;
      });
    } else {
      newRequest = _request;
    }

    return new interceptor.ComplexRequest({ request: newRequest, abort: abort });
  },
  response: function response(_response, config, meta) {
    // Init a virtual session linked to the uuid if the accessToken parameter is provided.

    var _parse2 = parse(_response.request.path);

    var pathname = _parse2.pathname;

    if (isAccessTokenRequest(pathname) && _response.status.code === 200) {
      if (!_response.entity.access_token) {
        console.error('Expected access token for request, but not in response!');
      } else {
        session.initAccessTokenSession(config.uuid, _response.entity.access_token);
        config.callback(_response.entity.access_token);
      }
    }
    // Check for invalid access-token status codes.
    if (_response.status.code === 401 || _response.status.code === 0) {
      // Perform the request again after renewing the access-token.
      return getAccessToken(config.authHost, getClientId(_response.request, config), config.uuid || noSSR, true, config.cookies, config.callback).then(function (accessToken) {
        if (!accessToken) throw new Error('Empty access-token provided!');
        updateHeaders(_response.request, accessToken);

        return meta.client(_response.request);
      });
    }

    return _response;
  }
});

function getToken(response) {
  return response.entity.csrfToken;
}

var _csrf = interceptor({
  request: function request(_request, config, meta) {
    if (_request.requiresCsrf) {
      var client = config.client || _request.originator || client.skip();

      return client({
        path: config.path,
        accessToken: false,
        clientID: true,
        method: 'GET'
      }).then(function (response) {
        return {
          csrfToken: getToken(response)
        };
      }).then(function (response) {
        var entity = _request.entity || {};
        entity.csrfToken = response.csrfToken;

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

var _clientIdInterceptor = interceptor({

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
var _pathPrefix = interceptor({
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

var _withCredentials = interceptor({
  request: function request(_request) {
    if (isAuthPath(_request.path)) {
      _request.withCredentials = true;
    }

    return _request;
  }
});

exports.rest = _rest;
exports.mime = _mime;
exports.errorCode = _errorCode;
exports.accessToken = _accessToken;
exports.csrf = _csrf;
exports.clientIdInterceptor = _clientIdInterceptor;
exports.withCredentials = _withCredentials;
exports.pathPrefix = _pathPrefix;
exports.accessTokenSession = session;