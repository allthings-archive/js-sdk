import rest from 'rest';
import mime from 'rest/interceptor/mime';
import errorCode from 'rest/interceptor/errorCode';
import defaultRequest from 'rest/interceptor/defaultRequest';
import pathPrefix from 'rest/interceptor/pathPrefix';
import interceptor from 'rest/interceptor';
import 'cookie';
import { Promise as Promise$1 } from 'when/es6-shim/Promise';

// the auth client
let auth$1 = null;

let currentToken = null;
// the token
let token = function () {
    if (!currentToken) {
        currentToken = new Promise((res, rej) => {
            auth$1({ path: 'access-token', client_id: true }).then(response => {
                if (response.status.code === 200) {
                    res(response.entity.access_token);
                } else {
                    rej(response.status.code);
                }
            });
        });
    }

    return currentToken;
};

var qipp = interceptor({
    init: function (config) {
        auth$1 = config.auth;

        return config;
    },
    request: function (request, config, meta) {
        return token().then(bearerToken => {

            let headers;
            headers = request.headers || (request.headers = {});
            headers.authorization = 'Bearer ' + bearerToken;

            return request;
        });
    },
    success: function (response, config, meta) {
        let { entity } = response;
        if (typeof entity == 'object' && entity.access_token) {
            auth$1 = entity;
        }

        return response;
    }
});

function getToken(response) {
    return response.entity.csrfToken;
}

var csrf = interceptor({
    init: function (config) {
        // do studd with the config
        return config;
    },
    request: function (request, config, meta) {

        if (request.requiresCsrf) {
            var client = config.client || request.originator || client.skip();

            return client({
                path: config.path,
                clientID: true,
                method: 'GET'
            }).then(response => {
                return {
                    csrfToken: getToken(response)
                };
            }).then(response => {
                var entity = JSON.parse(request.entity) || {};
                entity.csrfToken = response.csrfToken;
                request.entity = JSON.stringify(entity);

                return request;
            });
        }

        return request;
    },
    response: function (response, config, meta) {
        return response;
    },
    success: function (response, config, meta) {
        return response;
    },
    error: function (response, config, meta) {
        return response;
    }
});

interceptor({
    error: function (response) {
        return {
            error: {
                message: response.entity ? response.entity : '',
                status: response.status
            }
        };
    }
});

let clientIdPromise = null;

var clientIdInterceptor = interceptor({
    init: function (config) {
        if (!config.clientId.then) {
            clientIdPromise = new Promise$1.resolve(config.clientId);
        } else {
            clientIdPromise = config.clientId;
        }

        return config;
    },

    request: function (request, config, meta) {
        return clientIdPromise.then(clientId => {
            let params = request.params || {};

            if (request.clientId) {
                params.clientId = clientId;
                request.params = params;
            }

            if (request.clientID) {
                params.clientID = clientId;
                request.params = params;
            }

            if (request.client_id) {
                params.client_id = clientId;
                request.params = params;
            }

            return request;
        });
    }
});

let { a, b } = qipp;

const auth = ({ path, clientId }) => {
    return rest.wrap(defaultRequest, { mixin: { withCredentials: true } }).wrap(clientIdInterceptor, { clientId }).wrap(csrf, { path: path + 'csrf-token' }).wrap(pathPrefix, { prefix: path }).wrap(mime, { mime: 'application/json' }).wrap(errorCode, { code: 400 });
};

const api = ({ path, auth }) => {
    return rest.wrap(defaultRequest).wrap(pathPrefix, { prefix: path }).wrap(mime, { mime: 'application/json' }).wrap(errorCode, { code: 400 }).wrap(qipp, { auth });
};

var index = {
    api,
    auth
};

export default index;