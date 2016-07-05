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

const auth = ({ path, clientId, uuid }) => {
  return rest
    .wrap(defaultRequest, { mixin: { withCredentials: true } })
    .wrap(accessToken, { uuid, clientId })
    .wrap(clientIdInterceptor, { clientId })
    .wrap(csrf, { path: path + 'csrf-token' })
    .wrap(pathPrefix, { prefix: path })
    .wrap(mime, { mime: 'application/json' })
    .wrap(errorCode, { code: 400 })
}

const api = ({ path, clientId, uuid }) => {
  return rest
    .wrap(defaultRequest)
    .wrap(accessToken, { uuid, clientId })
    .wrap(clientIdInterceptor, { clientId })
    .wrap(pathPrefix, { prefix: path })
    .wrap(mime, { mime: 'application/json' })
    .wrap(errorCode, { code: 400 })
}

export default {
  api,
  auth,
  accessTokenSession
}
