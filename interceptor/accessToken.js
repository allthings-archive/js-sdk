import interceptor from 'rest/interceptor'

export default interceptor({

  request: function (request, config) {
    let headers
    headers = request.headers || (request.headers = {})
    headers.authorization = 'Bearer ' + config.bearerToken

    return request
  }
})
