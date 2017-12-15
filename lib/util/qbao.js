var util = require('util')
function QbaoError(message, errors) {
  Error.call(this, message)
  this.message = message
  this.name = 'QbaoError'
  this.errors = errors
  Error.captureStackTrace(this, QbaoError)
}
util.inherits(QbaoError, Error)
module.exports.QbaoError = QbaoError
