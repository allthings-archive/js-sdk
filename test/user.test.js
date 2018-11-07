import API from '../index'

const client = API(
  process.env.ALLTHINGS_OAUTH_URL,
  process.env.ALLTHINGS_REST_API_URL,
  process.env.ALLTHINGS_OAUTH_CLIENT_ID
)
jest.setTimeout(10000000)

describe('Authentication', () => {
  it('should be able to login', async () => {
    const response = await client({
      method: 'POST',
      path: 'auth/login',
      requiresCsrf: true,
      clientID: true,
      entity: {
        email: process.env.ALLTHINGS_OAUTH_USERNAME,
        password: process.env.ALLTHINGS_OAUTH_PASSWORD,
      },
    })
    expect(typeof response.entity.access_token).toBe('string')
    expect(typeof response.entity.expires_in).toBe('number')
    expect(typeof response.entity.user_id).toBe('string')
  })
  it('should be able to get me', async () => {
    const token = await client({
      method: 'POST',
      path: 'auth/login',
      requiresCsrf: true,
      clientID: true,
      entity: {
        email: process.env.ALLTHINGS_OAUTH_USERNAME,
        password: process.env.ALLTHINGS_OAUTH_PASSWORD,
      },
    })

    const response = await client({
      method: 'GET',
      path: '/api/v1/me',
      accessToken: token.entity.access_token,
    })

    const { lastLogin, ...user } = response.entity

    expect(user).toMatchSnapshot()
    expect(typeof Date.parse(lastLogin)).toBe('number')
  })
})
