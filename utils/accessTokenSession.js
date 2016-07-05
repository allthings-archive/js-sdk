import when from 'when'

const accessTokens = {}

const initAccessTokenSession = (uuid, accessToken) => {
  try {
    accessTokens[uuid] = when.promise((resolve) => { resolve(accessToken) })
  } catch (e) {
    console.error(e)
  }
}

const killAccessTokenSession = uuid => {
  try {
    delete accessTokens[uuid]
  } catch (e) {
    console.error(e)
  }
}

export default {
  accessTokens,
  initAccessTokenSession,
  killAccessTokenSession
}
