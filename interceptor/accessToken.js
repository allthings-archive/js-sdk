import interceptor from 'rest/interceptor';

export default interceptor({

  request: function (request, config, meta) {

    let headers;
    headers = request.headers || (request.headers = {});
    headers.authorization = 'Bearer ' + config.bearerToken;

    return request
  }
})