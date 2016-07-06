import interceptor from 'rest/interceptor'
import rest from 'rest'
import when from 'when'
import session from '../utils/accessTokenSession'
import parse from 'url-parse'

const noSSR = 'singleClient'

function getAccessToken (clientId, uuid, renew) {
  if (!session.accessTokens.hasOwnProperty(uuid) || renew) {
    session.accessTokens[uuid] = when.promise((resolve, reject) => {
      rest({
        method: 'GET',
        path: 'auth/access-token',
        params: { client_id: clientId },
        withCredentials: true
      }).then(response => {
        if (response.status.code === 200) {
          resolve(JSON.parse(response.entity).access_token)
        } else {
          reject(response.status.code)
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
  return (/^\/+auth\/(?!logout).*$/i).test(pathname) === false
}

function isAccessTokenRequest (pathname) {
  return (/^\/+auth\/(login|access-token)$/i).test(pathname)
}

export default interceptor({
  request: function (request, config) {
    const { pathname } = parse(request.path)
    return needsAccessToken(pathname) === false
      ? request
      : getAccessToken(getClientId(request, config), config.uuid || noSSR).then(accessToken => {
        if (!accessToken) throw new Error('Empty access-token provided!')
        updateHeaders(request, accessToken)
        return request
      })
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
        getClientId(response.request, config),
        config.uuid || noSSR,
        true
      ).then(accessToken => {
        if (!accessToken) throw new Error('Empty access-token provided!')
        updateHeaders(response.request, accessToken)

        return meta.client(response.request)
      })
    }

    return response
  }
})
