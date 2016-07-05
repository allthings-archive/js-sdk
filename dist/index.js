'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var rest = _interopDefault(require('rest'));
var mime = _interopDefault(require('rest/interceptor/mime'));
var errorCode = _interopDefault(require('rest/interceptor/errorCode'));
var defaultRequest = _interopDefault(require('rest/interceptor/defaultRequest'));
var pathPrefix = _interopDefault(require('rest/interceptor/pathPrefix'));
var interceptor = _interopDefault(require('rest/interceptor'));
var when = _interopDefault(require('when'));

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

function getAccessToken(clientId, uuid, renew) {
  try {
    if (!session.accessTokens.hasOwnProperty(uuid) || renew) {
      session.accessTokens[uuid] = when.promise(function (resolve, reject) {
        rest({
          method: 'GET',
          path: 'auth/access-token',
          params: { client_id: clientId },
          withCredentials: true
        }).then(function (response) {
          if (response.status.code === 200) {
            resolve(JSON.parse(response.entity).access_token);
          } else {
            reject(response.status.code);
          }
        });
      });
    }

    return session.accessTokens[uuid];
  } catch (e) {
    console.error(e);
  }
}

function updateHeaders(request, accessToken) {
  try {
    if (!accessToken) throw new Error('Empty access-token provided!');

    var headers = void 0;

    headers = request.headers || (request.headers = {});
    headers.Authorization = 'Bearer ' + accessToken;
  } catch (e) {
    console.error(e);
  }
}

var accessToken = interceptor({
  request: function request(_request, config) {
    try {
      return _request.startSession ? _request : getAccessToken(_request.params.client_id, config.uuid || noSSR).then(function (accessToken) {
        updateHeaders(_request, accessToken);

        return _request;
      });
    } catch (e) {
      console.error(e);
    }
  },

  response: function response(_response, config, meta) {
    try {
      // Init a virtual session linked to the uuid if the startSession parameter is provided.
      if (_response.request.startSession) {
        session.initAccessTokenSession(config.uuid, JSON.parse(_response.entity).access_token);
      }
      // Check for invalid access-token status codes.
      if (_response.status.code === 401 || _response.status.code === 0) {
        // Perform the request again after renewing the access-token.
        return getAccessToken(_response.request.params.client_id, config.uuid || noSSR, true).then(function (accessToken) {
          updateHeaders(_response.request, accessToken);

          return meta.client(_response.request);
        });
      }

      return _response;
    } catch (e) {
      console.error(e);
    }
  }
});

function getToken(response) {
  try {
    return response.entity.csrfToken;
  } catch (e) {
    console.error(e);
  }
}

var csrf = interceptor({
  init: function init(config) {
    // Do studd with the config.
    return config;
  },
  request: function request(_request, config, meta) {
    try {
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
    } catch (e) {
      console.error(e);
    }
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
  var uuid = _ref.uuid;

  return rest.wrap(defaultRequest, { mixin: { withCredentials: true } }).wrap(accessToken, { uuid: uuid }).wrap(clientIdInterceptor, { clientId: clientId }).wrap(csrf, { path: path + 'csrf-token' }).wrap(pathPrefix, { prefix: path }).wrap(mime, { mime: 'application/json' }).wrap(errorCode, { code: 400 });
};

var api = function api(_ref2) {
  var path = _ref2.path;
  var clientId = _ref2.clientId;
  var uuid = _ref2.uuid;

  return rest.wrap(defaultRequest).wrap(accessToken, { uuid: uuid }).wrap(clientIdInterceptor, { clientId: clientId }).wrap(pathPrefix, { prefix: path }).wrap(mime, { mime: 'application/json' }).wrap(errorCode, { code: 400 });
};

var index = {
  api: api,
  auth: auth,
  accessTokenSession: session
};

module.exports = index;