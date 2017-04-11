import rest from 'rest'

import mime from 'rest/interceptor/mime'
import params from 'rest/interceptor/params'

import withCredentials from './interceptor/withCredentials'
import accessToken from './interceptor/accessToken'
import clientIdInterceptor from './interceptor/clientId'
import csrf from './interceptor/csrf'
import pathPrefix from './interceptor/pathPrefix'

export default (authHost, apiHost, clientId) => {
  return rest
    .wrap(withCredentials)
    .wrap(mime, { mime: 'application/json' })
    .wrap(accessToken)
    .wrap(params)
    .wrap(clientIdInterceptor, { clientId })
    .wrap(csrf, { path: 'auth/csrf-token' })
    .wrap(pathPrefix, { authHost, apiHost })
}
