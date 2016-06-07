import interceptor from 'rest/interceptor';

export default interceptor({
    error: function (response) {
        return {
            error: {
                message: response.entity ? response.entity : '',
                status: response.status
            }
        }
    }
});
