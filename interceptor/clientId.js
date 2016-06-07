import interceptor from 'rest/interceptor';

let clientIdPromise = null;

export default interceptor({
    init: function (config) {
        if (!config.clientId.then) {
            clientIdPromise = new Promise.resolve(config.clientId)
        } else {
            clientIdPromise = config.clientId
        }

        return config
    },

    request: function (request, config, meta) {
        return clientIdPromise.then(clientId => {
            let params = request.params || {}

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

            return request
        })
    }
});
