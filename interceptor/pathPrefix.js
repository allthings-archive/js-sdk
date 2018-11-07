import interceptor from 'rest/interceptor'
import UrlBuilder from 'rest/UrlBuilder'

export function isAuthPath(pathname) {
  return /^\/?auth/.test(pathname)
}

function startsWith(str, prefix) {
  return str.indexOf(prefix) === 0
}

function endsWith(str, suffix) {
  return str.lastIndexOf(suffix) + suffix.length === str.length
}

// Extended standard `prefix` interceptor
export default interceptor({
  request(request, config) {
    if (!new UrlBuilder(request.path).isFullyQualified()) {
      let prefixPath = isAuthPath(request.path)
        ? config.authHost
        : config.apiHost

      if (request.path) {
        if (!endsWith(prefixPath, '/') && !startsWith(request.path, '/')) {
          prefixPath += '/'
        } else if (endsWith(prefixPath, '/') && startsWith(request.path, '/')) {
          prefixPath = prefixPath.slice(0, -1)
        }
        prefixPath += request.path
      }
      request.path = prefixPath
    }

    return request
  },
})
