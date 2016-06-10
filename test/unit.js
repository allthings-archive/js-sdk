import nock from 'nock'
import test from 'ava'
import sdk from '../index'

test.before(() => {
  nock('v1')
    .get('/me')
    .reply(200, 'user')
})

test(async t => {
  const request = sdk.api({
    method: 'GET',
    path: 'v1/me'
  })
  const response = await request()
  t.is(response, 'user')
})
