import rest from 'rest'

// Interceptors
import mime from 'rest/interceptor/mime'
import errorCode from 'rest/interceptor/errorCode'
import defaultRequest from 'rest/interceptor/defaultRequest'
import pathPrefix from 'rest/interceptor/pathPrefix'

import accessToken from './interceptor/accessToken'
import csrf from './interceptor/csrf'
import clientIdInterceptor from './interceptor/clientId'

// Utils
import accessTokenSession from './utils/accessTokenSession'

const auth = (path, clientId, uuid, callback) => {
  return rest
    .wrap(defaultRequest, { mixin: { withCredentials: true } })
    .wrap(mime, { mime: 'application/json' })
    .wrap(accessToken, { uuid, clientId, callback })
    .wrap(clientIdInterceptor, { clientId })
    .wrap(csrf, { path: path + 'csrf-token' })
    .wrap(pathPrefix, { prefix: path })
    .wrap(errorCode, { code: 400 })
}

const api = (path, clientId, uuid, callback) => {
  return rest
    .wrap(defaultRequest)
    .wrap(mime, { mime: 'application/json' })
    .wrap(accessToken, { uuid, clientId, callback })
    .wrap(clientIdInterceptor, { clientId })
    .wrap(pathPrefix, { prefix: path })
    .wrap(errorCode, { code: 400 })
}

export default {
  api,
  auth,
  accessTokenSession
}
