import interceptor from 'rest/interceptor';

export default interceptor({

    request: function (request, config, meta) {
        let params = request.params || {}

        if (request.clientId) {
            params.clientId = config.clientId;
            request.params = params;
        }

        if (request.clientID) {
            params.clientID = config.clientId;
            request.params = params;
        }

        if (request.client_id) {
            params.client_id = config.clientId;
            request.params = params;
        }

        return request
    }
});
