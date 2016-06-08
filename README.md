# js-sdk

## example 

```js
import { auth, api } from 'allthings-js-sdk'

const authClient = auth({
  path: 'https://allthings-app.dev.qipp.com/auth/',
  clientId: '123123123' // Also might be a promise :-)
})

const apiClient = api({
  path: 'https://api.dev.qipp.com/api/',
  auth: authClient
})

export default {
  auth: authClient,
  api: apiClient
}
```

## based on 

https://github.com/cujojs/rest
