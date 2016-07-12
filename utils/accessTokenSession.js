import when from 'when'

const accessTokens = {}

const initAccessTokenSession = (uuid, accessToken) => {
  accessTokens[uuid] = when.promise((resolve) => { resolve(accessToken) })
}

const killAccessTokenSession = uuid => {
  delete accessTokens[uuid]
}

export default {
  accessTokens,
  initAccessTokenSession,
  killAccessTokenSession
}
