import { Promise } from 'es6-promise'

const accessTokens = {}

const ongoingRequests = {}

const initAccessTokenSession = (uuid, accessToken) => {
  // Add the access token promise into the store.
  accessTokens[uuid] = new Promise((resolve) => { resolve(accessToken) })
}

const killAccessTokenSession = uuid => {
  const ongoing = ongoingRequests[uuid]
  // Wait for all the ongoing requests to be performed.
  if (ongoing && ongoing.length > 0) {
    Promise.all(ongoing).then(promises => {
      delete accessTokens[uuid]
      delete ongoingRequests[uuid]
    })
  }
}

export default {
  accessTokens,
  initAccessTokenSession,
  killAccessTokenSession,
  ongoingRequests
}
