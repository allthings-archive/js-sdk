import withCredentials from './interceptor/withCredentials'
import rest from 'rest'

import timeout from 'rest/interceptor/timeout'
import mime from 'rest/interceptor/mime'
import errorCode from 'rest/interceptor/errorCode'

import accessToken from './interceptor/accessToken'
import csrf from './interceptor/csrf'
import clientIdInterceptor from './interceptor/clientId'
import pathPrefix from './interceptor/pathPrefix'
import retry from 'rest/interceptor/retry'
import params from 'rest/interceptor/params'

export default (authHost, apiHost, clientId) => {
  return rest
    .wrap(withCredentials)
    .wrap(mime, { mime: 'application/json' })
    .wrap(accessToken)
    .wrap(params)
    .wrap(clientIdInterceptor, { clientId })
    .wrap(csrf, { path: 'auth/csrf-token' })
    .wrap(pathPrefix, { authHost, apiHost })
    .wrap(errorCode, { code: 500 })
    .wrap(retry, { initial: 200, max: 10000 })
    .wrap(timeout, { timeout: 5000 })
}

export requests from './requests'
