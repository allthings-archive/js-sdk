import interceptor from 'rest/interceptor'

function getToken (response) {
  return response.entity.csrfToken
}

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
        return {
          csrfToken: getToken(response)
        }
      }).then(response => {
        var entity = request.entity || {}
        entity.csrfToken = response.csrfToken

        return request
      }).catch(e => {
        console.error(
          `An error occured while trying to get a new csrf token: ${JSON.stringify(e, null, 2)}`
        )
      })
    }

    return request
  },
  response: function (response, config, meta) {
    return response
  },
  success: function (response, config, meta) {
    return response
  },
  error: function (response, config, meta) {
    return response
  }
})
