import interceptor from 'rest/interceptor'
import { parse, serialize } from 'cookie'

export default interceptor({
  request: function(request, config, meta) {
    if (request.requiresCsrf) {
      var client = config.client || request.originator || client.skip()
      return client({
        path: config.path,
        accessToken: false,
        clientID: true,
        method: 'GET',
      }).then(response => {
        const cookie = parse(response.headers['Set-Cookie'].pop())
        request.entity = request.entity || {}
        request.entity.csrfToken = response.entity.csrfToken
        request.headers = request.headers || {}
        request.headers.cookie = serialize('PHPSESSID', cookie.PHPSESSID)

        return request
      })
    }
    return request
  },
})
