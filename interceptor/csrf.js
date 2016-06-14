// import cookie from 'cookie'
import interceptor from 'rest/interceptor'

function getToken (response) {
  return response.entity.csrfToken
}

export default interceptor({
  init: function (config) {
    // do studd with the config
    return config
  },
  request: function (request, config, meta) {
    if (request.requiresCsrf) {
      var client = (config.client || request.originator || client.skip())

      return client({
        path: config.path,
        clientID: true,
        method: 'GET'
      })
        .then(response => {
          return {
            csrfToken: getToken(response)
          }
        })
        .then(response => {
          var entity = JSON.parse(request.entity) || {}
          entity.csrfToken = response.csrfToken
          request.entity = JSON.stringify(entity)

          return request
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
