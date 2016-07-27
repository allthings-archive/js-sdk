'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _rest = _interopDefault(require('rest'));
var _timeout = _interopDefault(require('rest/interceptor/timeout'));
var _mime = _interopDefault(require('rest/interceptor/mime'));
var _errorCode = _interopDefault(require('rest/interceptor/errorCode'));
var interceptor = _interopDefault(require('rest/interceptor'));
var es6Promise = require('es6-promise');
var parse = _interopDefault(require('url-parse'));
var stringify = _interopDefault(require('json-stringify-safe'));
var UrlBuilder = _interopDefault(require('rest/UrlBuilder'));

var accessTokens = {};

var ongoingRequests = {};

var initAccessTokenSession = function initAccessTokenSession(uuid, accessToken) {
  // Add the access token promise into the store.
  accessTokens[uuid] = new es6Promise.Promise(function (resolve) {
    resolve(accessToken);
  });
};

var killAccessTokenSession = function killAccessTokenSession(uuid) {
  var ongoing = ongoingRequests[uuid];
  // Wait for all the ongoing requests to be performed.
  if (ongoing && ongoing.length > 0) {
    es6Promise.Promise.all(ongoing).then(function (promises) {
      delete accessTokens[uuid];
      delete ongoingRequests[uuid];
    });
  }
};

var session = {
  accessTokens: accessTokens,
  initAccessTokenSession: initAccessTokenSession,
  killAccessTokenSession: killAccessTokenSession,
  ongoingRequests: ongoingRequests
};

var noSSR = 'singleClient';

function handleError(e, uuid) {
  session.killAccessTokenSession(uuid);
  console.error('An error occured while trying to get a new access token: ' + stringify(e, null, 2));
}

function getAccessToken(authHost, clientId, uuid, renew, cookies, callback, err) {
  if (!session.accessTokens.hasOwnProperty(uuid) || renew) {
    session.accessTokens[uuid] = new es6Promise.Promise(function (resolve, reject) {
      reject = err || reject;
      var host = authHost.replace(/\/$/, '');

      var params = {
        method: 'GET',
        path: host + '/auth/access-token',
        params: { client_id: clientId },
        withCredentials: true
      };

      if (cookies !== null) params.headers = { Cookie: cookies };

      _rest(params).then(function (response) {
        if (response.status.code === 200) {
          var token = JSON.parse(response.entity).access_token;
          resolve(token);
          callback(token);
        } else {
          reject(response);
        }
      }).catch(function (e) {
        return handleError(e, uuid);
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
  return (/^\/*auth\/(?!logout).*$/i.test(pathname) === false && /api\/v1\/helpers\/request-headers/i.test(pathname) === false
  );
}

function isAccessTokenRequest(pathname) {
  return (/^\/*auth\/(access-token|login|oauth-login|password-reset\/[A-Za-z0-9]*)$/i.test(pathname)
  );
}

var _accessToken = interceptor({
  init: function init(config) {
    config.uuid = config.uuid || noSSR;

    return config;
  },
  request: function request(_request, config) {
    var _parse = parse(_request.path);

    var pathname = _parse.pathname;

    var abort = new es6Promise.Promise(function (resolve, reject) {
      triggerAbort = reject;
    });
    var newRequest = void 0;
    var triggerAbort = void 0;

    if (needsAccessToken(pathname) === true) {
      newRequest = getAccessToken(config.authHost, getClientId(_request, config), config.uuid, false, config.cookies, config.callback, triggerAbort).then(function (accessToken) {
        if (!accessToken) throw new Error('Empty access-token provided!');
        updateHeaders(_request, accessToken);
        // Push the new ongoing request to the pool.
        if (!session.ongoingRequests.hasOwnProperty(config.uuid)) {
          session.ongoingRequests[config.uuid] = [];
        }
        session.ongoingRequests[config.uuid].push(_request);

        return _request;
      }).catch(function (e) {
        return handleError(e, config.uuid);
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
      return getAccessToken(config.authHost, getClientId(_response.request, config), config.uuid, true, config.cookies, config.callback).then(function (accessToken) {
        if (!accessToken) throw new Error('Empty access-token provided!');
        updateHeaders(_response.request, accessToken);

        return meta.client(_response.request);
      }).catch(function (e) {
        return handleError(e, config.uuid);
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
      }).catch(function (e) {
        console.error('An error occured while trying to get a new csrf token: ' + stringify(e, null, 2));
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
    if (isAuthPath(_request.path)) _request.withCredentials = true;

    return _request;
  }
});

exports.rest = _rest;
exports.timeout = _timeout;
exports.mime = _mime;
exports.errorCode = _errorCode;
exports.accessToken = _accessToken;
exports.csrf = _csrf;
exports.clientIdInterceptor = _clientIdInterceptor;
exports.withCredentials = _withCredentials;
exports.pathPrefix = _pathPrefix;
exports.accessTokenSession = session;