import interceptor from 'rest/interceptor'
import { isAuthPath } from './pathPrefix'

export default interceptor({
  request (request) {
    if (isAuthPath(request.path)) {
      request.withCredentials = true
    }

    return request
  }
})
