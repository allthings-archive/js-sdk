import interceptor from 'rest/interceptor'

export default interceptor({

  request: function (request, config) {
    const bearerToken = request.bearerToken || config.bearerToken

    if (bearerToken) {
      let headers
      headers = request.headers || (request.headers = {})
      headers.Authorization = `Bearer ${bearerToken}`
    }

    return request
  }
})
