import rest from 'rest'

import mime from 'rest/interceptor/mime'
import errorCode from 'rest/interceptor/errorCode'
import defaultRequest from 'rest/interceptor/defaultRequest'
import pathPrefix from 'rest/interceptor/pathPrefix'

import accessToken from './interceptor/accessToken'
import csrf from './interceptor/csrf'
import clientIdInterceptor from './interceptor/clientId'

const auth = ({ path, clientId }) => {
  return rest.wrap(defaultRequest, { mixin: { withCredentials: true } })
    .wrap(clientIdInterceptor, { clientId })
    .wrap(csrf, { path: path + 'csrf-token' })
    .wrap(pathPrefix, { prefix: path })
    .wrap(mime, { mime: 'application/json' })
    .wrap(errorCode, { code: 400 })
}

const api = ({ path, token }) => {
  return rest.wrap(defaultRequest)
    .wrap(pathPrefix, { prefix: path })
    .wrap(mime, { mime: 'application/json' })
    .wrap(errorCode, { code: 400 })
    .wrap(accessToken, { bearerToken: token })
}

export default {
  api,
  auth
}
