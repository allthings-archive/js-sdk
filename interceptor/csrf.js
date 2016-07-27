import interceptor from 'rest/interceptor'

export default interceptor({
  request: function (request, config, meta) {
    if (request.requiresCsrf) {
      var client = (config.client || request.originator || client.skip())
      return client({
        path: config.path,
        accessToken: false,
        clientID: true,
        method: 'GET'
      }).then(response => {
        request.entity = request.entity || {}
        request.entity.csrfToken = response.entity.csrfToken

        return request
      })
    }
    return request
  }
})
