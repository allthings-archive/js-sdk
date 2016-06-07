import interceptor from 'rest/interceptor';
import { when } from 'when';

// the auth client
let auth  = null;

let currentToken = null;
// the token
let token = function() {
    if (!currentToken) {
        currentToken = when.promise((res, rej) => {
            auth({ path: 'access-token', client_id: true }).then(response => {
                if  (response.status.code === 200) {
                    res(response.entity.access_token)
                } else {
                    rej(response.status.code)
                }
            })
        })
    }

    return currentToken;
};

export default interceptor({
    init: function (config) {
        auth = config.auth

        return config
    },
    request: function (request, config, meta) {
        return token().then(bearerToken => {

            let headers;
            headers = request.headers || (request.headers = { });
            headers.authorization = 'Bearer ' + bearerToken;

            return request;
        });
    },
    success: function (response, config, meta) {
        let { entity } = response
        if (typeof entity == 'object' && entity.access_token) {
            auth = entity;
        }

        return response;
    }
});
