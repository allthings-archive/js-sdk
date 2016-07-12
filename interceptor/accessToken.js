import interceptor from 'rest/interceptor'
import rest from 'rest'
import when from 'when'
import session from '../utils/accessTokenSession'
import parse from 'url-parse'

const noSSR = 'singleClient'

function getAccessToken (authHost, clientId, uuid, renew, cookies, callback, err) {
  if (!session.accessTokens.hasOwnProperty(uuid) || renew) {
    session.accessTokens[uuid] = when.promise((resolve, reject) => {
      const host = authHost.replace(/\/$/, '')

      const params = {
        method: 'GET',
        path: host + '/auth/access-token',
        params: { client_id: clientId },
        withCredentials: true
      }

      if (cookies !== null) {
        params.headers = { Cookie: cookies }
      }

      rest(params).then(response => {
        if (response.status.code === 200) {
          const token = JSON.parse(response.entity).access_token
          resolve(token)
          callback(token)
        } else {
          err(response)
        }
      })
    })
  }

  return session.accessTokens[uuid]
}

function updateHeaders (request, accessToken) {
  let headers

  headers = request.headers || (request.headers = {})
  headers.Authorization = `Bearer ${accessToken}`
}

function getClientId (request, config) {
  const { params } = request
  if (params && (params.client_id || params.clientId || params.clientID)) {
    return params.client_id || params.clientId || params.clientID
  } else {
    return config.clientId
  }
}

function needsAccessToken (pathname) {
  return (/^\/*auth\/(?!logout).*$/i).test(pathname) === false
}

function isAccessTokenRequest (pathname) {
  return (/^\/*auth\/(access-token|login|password-reset\/[A-Za-z0-9]*)$/i).test(pathname)
}

export default interceptor({
  init: function (config) {
    config.code = config.code || function () {}
    return config
  },

  request: function (request, config) {
    const { pathname } = parse(request.path)
    let newRequest, triggerAbort

    const abort = new Promise(function (resolve, reject) {
      triggerAbort = reject;
    })

    if (needsAccessToken(pathname) === true) {
      newRequest = getAccessToken(
        config.authHost,
        getClientId(request, config),
        config.uuid || noSSR,
        false,
        config.cookies,
        config.callback,
        triggerAbort
      ).then(accessToken => {
        if (!accessToken) throw new Error('Empty access-token provided!')
        updateHeaders(request, accessToken)
        return request
      })
    } else {
      newRequest = request
    }

    return new interceptor.ComplexRequest({ request: newRequest, abort: abort });
    // return request
  },

  response: function (response, config, meta) {
    // Init a virtual session linked to the uuid if the accessToken parameter is provided.
    const { pathname } = parse(response.request.path)
    if (isAccessTokenRequest(pathname) && response.code === 200) {
      if (!response.entity.access_token) {
        console.error('Expected access token for request, but not in response!')
      } else {
        session.initAccessTokenSession(config.uuid, response.entity.access_token)
      }
    }
    // Check for invalid access-token status codes.
    if (response.status.code === 401 || response.status.code === 0) {
      // Perform the request again after renewing the access-token.
      return getAccessToken(
        config.authHost,
        getClientId(response.request, config),
        config.uuid || noSSR,
        true,
        config.cookies,
        config.callback
      ).then(accessToken => {
        if (!accessToken) throw new Error('Empty access-token provided!')
        updateHeaders(response.request, accessToken)

        return meta.client(response.request)
      })
    }

    return response
  }
})
