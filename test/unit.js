import test from 'ava'
// import { login, localeHelper } from '../requests'
// import defaultClient from '../index'

test(async t => {
  /**
   const client = defaultClient(
   'https://allthings-app.dev.qipp.com',
   'https://api.dev.qipp.com',
   '575027e58178f56a008b4568_3t6ualb01m2o0gocgw40c48c0k000kgkk8oss4oooss8o8ogsw'
   )
   const lang = await client(localeHelper())
   const csrf = await client({
    path: 'auth/csrf-token'
  })
   let cookie = csrf.headers['Set-Cookie'][0].split(';')[0]
   const loginRequest = login('user', 'password')

   const token = await client({
    ...loginRequest,
    requiresCsrf: false,
    entity: {
      ...loginRequest.entity,
      csrfToken: token.entity.csrfToken
    },
    headers: { Cookie: cookie }
  })

   t.assert(client, lang, csrf, token)
   **/
})
