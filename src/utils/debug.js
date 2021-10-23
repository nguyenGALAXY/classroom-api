import debugModule from 'debug'

function log(namespace, message) {
  const debug = debugModule(namespace)
  debug(message)
}

export default {
  log
}
