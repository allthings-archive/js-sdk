export function login (email, password) {
  return {
    method: 'POST',
    path: 'auth/login',
    requiresCsrf: true,
    clientID: true,
    entity: {
      email,
      password
    }
  }
}

export function localeHelper () {
  return {
    method: 'GET',
    path: 'api/v1/helpers/locale',
    clientID: true
  }
}

export function accessToken () {
  return {
    method: 'GET',
    path: 'auth/access-token',
    clientID: true
  }
}

export default null
