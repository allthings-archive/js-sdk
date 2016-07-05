import interceptor from 'rest/interceptor'

export default interceptor({

  request: function (request, config) {
    try {
      if (config.clientId) request.params = { client_id: config.clientId }
      return request
    } catch (e) {
      console.error(e)
    }
  }
})
