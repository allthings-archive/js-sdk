'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var rest = _interopDefault(require('rest'));
var mime = _interopDefault(require('rest/interceptor/mime'));
var errorCode = _interopDefault(require('rest/interceptor/errorCode'));
var defaultRequest = _interopDefault(require('rest/interceptor/defaultRequest'));
var pathPrefix = _interopDefault(require('rest/interceptor/pathPrefix'));
var interceptor = _interopDefault(require('rest/interceptor'));
var when = _interopDefault(require('when'));
var parse = _interopDefault(require('url-parse'));

var accessTokens = {};

var initAccessTokenSession = function initAccessTokenSession(uuid, accessToken) {
  try {
    accessTokens[uuid] = when.promise(function (resolve) {
      resolve(accessToken);
    });
  } catch (e) {
    console.error(e);
  }
};

var killAccessTokenSession = function killAccessTokenSession(uuid) {
  try {
    delete accessTokens[uuid];
  } catch (e) {
    console.error(e);
  }
};

var session = {
  accessTokens: accessTokens,
  initAccessTokenSession: initAccessTokenSession,
  killAccessTokenSession: killAccessTokenSession
};

var noSSR = 'singleClient';

function getAccessToken(clientId, uuid, renew, callback) {
  if (!session.accessTokens.hasOwnProperty(uuid) || renew) {
    session.accessTokens[uuid] = when.promise(function (resolve, reject) {
      rest({
        method: 'GET',
        path: 'auth/access-token',
        params: { client_id: clientId },
        withCredentials: true
      }).then(function (response) {
        if (response.status.code === 200) {
          var token = JSON.parse(response.entity).access_token;
          resolve(token);
          callback(token);
        } else {
          reject(response.status.code);
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
  return (/^\/+auth\/(?!logout).*$/i.test(pathname) === false
  );
}

function isAccessTokenRequest(pathname) {
  return (/^\/+auth\/(access-token|login|password-reset\/[A-Za-z0-9]*)$/i.test(pathname)
  );
}

var accessToken = interceptor({
  init: function init(config) {
    config.code = config.code || function () {};
    return config;
  },

  request: function request(_request, config) {
    var _parse = parse(_request.path);

    var pathname = _parse.pathname;

    if (needsAccessToken(pathname) === true) {
      return getAccessToken(getClientId(_request, config), config.uuid || noSSR, false, config.callback).then(function (accessToken) {
        if (!accessToken) throw new Error('Empty access-token provided!');
        updateHeaders(_request, accessToken);
        return _request;
      });
    }

    return _request;
  },

  response: function response(_response, config, meta) {
    // Init a virtual session linked to the uuid if the accessToken parameter is provided.

    var _parse2 = parse(_response.request.path);

    var pathname = _parse2.pathname;

    if (isAccessTokenRequest(pathname) && _response.code === 200) {
      if (!_response.entity.access_token) {
        console.error('Expected access token for request, but not in response!');
      } else {
        session.initAccessTokenSession(config.uuid, _response.entity.access_token);
      }
    }
    // Check for invalid access-token status codes.
    if (_response.status.code === 401 || _response.status.code === 0) {
      // Perform the request again after renewing the access-token.
      return getAccessToken(getClientId(_response.request, config), config.uuid || noSSR, true, config.callback).then(function (accessToken) {
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

var auth = function auth(path, clientId, uuid, callback) {
  return rest.wrap(defaultRequest, { mixin: { withCredentials: true } }).wrap(mime, { mime: 'application/json' }).wrap(accessToken, { uuid: uuid, clientId: clientId, callback: callback }).wrap(clientIdInterceptor, { clientId: clientId }).wrap(csrf, { path: path + 'csrf-token' }).wrap(pathPrefix, { prefix: path }).wrap(errorCode, { code: 400 });
};

var api = function api(path, clientId, uuid, callback) {
  return rest.wrap(defaultRequest).wrap(mime, { mime: 'application/json' }).wrap(accessToken, { uuid: uuid, clientId: clientId, callback: callback }).wrap(clientIdInterceptor, { clientId: clientId }).wrap(pathPrefix, { prefix: path }).wrap(errorCode, { code: 400 });
};

var index = {
  api: api,
  auth: auth,
  accessTokenSession: session
};

module.exports = index;