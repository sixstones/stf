var util = require('util')

var Promise = require('bluebird')
var EventEmitter = require('eventemitter3')
var logger = require('./logger')

function RiskyStream(stream) {
  var log = logger.createLogger('util:riskystream')
  EventEmitter.call(this)

  this.endListener = function() {
    this.ended = true
    this.stream.removeListener('end', this.endListener)

    if (!this.expectingEnd) {
      this.emit('unexpectedEnd')
    }

    this.emit('end')
  }.bind(this)

  this.errorListener = function(error) {
    log.error(error.stack)
  }
  this.stream = stream
    .on('end', this.endListener)
    .on('error', this.errorListener)
  this.expectingEnd = false
  this.ended = false
}

util.inherits(RiskyStream, EventEmitter)

RiskyStream.prototype.end = function() {
  this.expectEnd()
  return this.stream.end()
}

RiskyStream.prototype.expectEnd = function() {
  this.expectingEnd = true
  return this
}

RiskyStream.prototype.waitForEnd = function() {
  var stream = this.stream
  var endListener

  this.expectEnd()

  return new Promise(function(resolve) {
      if (stream.ended) {
        return resolve(true)
      }

      stream.on('end', endListener = function() {
        resolve(true)
      })

      // Make sure we actually have a chance to get the 'end' event.
      stream.resume()
    })
    .finally(function() {
      stream.removeListener('end', endListener)
    })
}

module.exports = RiskyStream
