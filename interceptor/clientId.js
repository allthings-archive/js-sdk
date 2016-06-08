import interceptor from 'rest/interceptor';

let clientIdConfig = null;

export default interceptor({
    init: function (config) {
        clientIdConfig = config.clientId

        return config
    },

    request: function (request, config, meta) {
        let params = request.params || {}

        if (request.clientId) {
            params.clientId = clientIdConfig;
            request.params = params;
        }

        if (request.clientID) {
            params.clientID = clientIdConfig;
            request.params = params;
        }

        if (request.client_id) {
            params.client_id = clientIdConfig;
            request.params = params;
        }

        return request
    }
});
