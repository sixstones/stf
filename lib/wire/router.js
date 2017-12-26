var EventEmitter = require('eventemitter3')
var util = require('util')

var wire = require('./')
var log = require('../util/logger').createLogger('wire:router')
var on = EventEmitter.prototype.on

function Router() {
  if (!(this instanceof Router)) {
    return new Router()
  }

  EventEmitter.call(this)
}

util.inherits(Router, EventEmitter)

Router.prototype.on = function(message, handler) {
  try {
    return on.call(this, message.$code, handler)
  }
  catch (error) {
    log.error('router handler occur error', error.stack)
  }
}

Router.prototype.removeListener = function(message, handler) {
  return EventEmitter.prototype.removeListener.call(
    this
  , message.$code
  , handler
  )
}

Router.prototype.handler = function() {
  try {
    return function(channel, data) {
      var wrapper = wire.Envelope.decode(data)
      var type = wire.ReverseMessageType[wrapper.type]

      if (type) {
        this.emit(
          wrapper.type
          , wrapper.channel || channel
          , wire[type].decode(wrapper.message)
          , data
        )
        this.emit(
          'message'
          , channel
        )
      }
      else {
        log.warn(
          'Unknown message type "%d", perhaps we need an update?'
          , wrapper.type
        )
      }
    }.bind(this)
  }
  catch(error) {
    log.error('router handler occur error', error.stack)
  }
}

module.exports = Router
