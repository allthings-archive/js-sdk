import interceptor from 'rest/interceptor'

function getToken (response) {
  try {
    return response.entity.csrfToken
  } catch (e) {
    console.error(e)
  }
}

export default interceptor({
  init: function (config) {
    // Do studd with the config.
    return config
  },
  request: function (request, config, meta) {
    try {
      if (request.requiresCsrf) {
        var client = (config.client || request.originator || client.skip())

        return client({
          path: config.path,
          accessToken: false,
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
    } catch (e) {
      console.error(e)
    }
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
