import interceptor from 'rest/interceptor'

export default interceptor({

  request: function (request, config) {
    let params = request.params || {}
    let clientId = config.clientId
    const requestId = params.client_id || params.clientId || params.clientID
    if (requestId && typeof requestId === 'string') {
      clientId = requestId
    }

    if (request.clientId) {
      params.clientId = clientId
      request.params = params
    }

    if (request.clientID) {
      params.clientID = clientId
      request.params = params
    }

    if (request.client_id) {
      params.client_id = clientId
      request.params = params
    }

    return request
  }
})
