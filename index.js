import rest from 'rest'

// Interceptors
import mime from 'rest/interceptor/mime'
import errorCode from 'rest/interceptor/errorCode'

import accessToken from './interceptor/accessToken'
import csrf from './interceptor/csrf'
import clientIdInterceptor from './interceptor/clientId'
import withCredentials from './interceptor/withCredentials'
import pathPrefix from './interceptor/pathPrefix'

// Utils
import accessTokenSession from './utils/accessTokenSession'

const api = (authHost, apiHost, clientId, uuid, callback) => {
  return rest
    .wrap(withCredentials)
    .wrap(mime, { mime: 'application/json' })
    .wrap(accessToken, { authHost, uuid, clientId, callback })
    .wrap(clientIdInterceptor, { clientId })
    .wrap(csrf, { path: 'auth/csrf-token' })
    .wrap(pathPrefix, { authHost, apiHost })
    .wrap(errorCode, { code: 500 })
}

export default {
  api,
  accessTokenSession
}
