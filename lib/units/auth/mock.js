var http = require('http')

var express = require('express')
var validator = require('express-validator')
var cookieSession = require('cookie-session')
var bodyParser = require('body-parser')
var serveStatic = require('serve-static')
var csrf = require('csurf')
var Promise = require('bluebird')
var basicAuth = require('basic-auth')

var logger = require('../../util/logger')
var requtil = require('../../util/requtil')
var qbao = require('../../util/qbao')
var jwtutil = require('../../util/jwtutil')
var pathutil = require('../../util/pathutil')
var urlutil = require('../../util/urlutil')
var lifecycle = require('../../util/lifecycle')
var mailutil = require('../../util/mailutil')
var dbapi = require('../../db/api')
var uuid = require('uuid')


module.exports = function(options) {
  var log = logger.createLogger('auth-mock')
  var app = express()
  var server = Promise.promisifyAll(http.createServer(app))

  lifecycle.observe(function() {
    log.info('Waiting for client connections to end')
    return server.closeAsync()
      .catch(function() {
        // Okay
      })
  })

  // BasicAuth Middleware
  var basicAuthMiddleware = function(req, res, next) {
    function unauthorized(res) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
      return res.send(401)
    }

    var user = basicAuth(req)

    if (!user || !user.name || !user.pass) {
      return unauthorized(res)
    }

    if (user.name === options.mock.basicAuth.username &&
        user.pass === options.mock.basicAuth.password) {
      return next()
    }
    else {
      return unauthorized(res)
    }
  }

  app.set('view engine', 'pug')
  app.set('views', pathutil.resource('auth/mock/views'))
  app.set('strict routing', true)
  app.set('case sensitive routing', true)

  app.use(cookieSession({
    name: options.ssid
  , keys: [options.secret]
  }))
  app.use(bodyParser.json())
  app.use(csrf())
  app.use(validator())
  app.use('/static/bower_components',
    serveStatic(pathutil.resource('bower_components')))
  app.use('/static/auth/mock', serveStatic(pathutil.resource('auth/mock')))

  app.use(function(req, res, next) {
    res.cookie('XSRF-TOKEN', req.csrfToken())
    next()
  })

  if (options.mock.useBasicAuth) {
    app.use(basicAuthMiddleware)
  }

  app.get('/', function(req, res) {
    res.redirect('/auth/mock/')
  })

  app.get('/auth/mock/', function(req, res) {
    res.render('index')
  })

  app.get('/auth/registe/', function(req, res) {
    res.render('index')
  })

  app.get('/auth/verifyScucess', function(req, res) {
    res.render('index')
  })
  app.get('/auth/verify/:code', function(req, res) {
    var code = req.params.code
    log.info('开始验证注册用户，验证码【%s】', code)
    dbapi.checkVerifyCode(code)
      .then(function(cursor) {
        return cursor.toArray()
      })
      .then(function(users) {
        if(users.length !== 1) {
          throw new qbao.QbaoError('该验证码错误', req.validationErrors())
        }
        return dbapi.updateUserState(users[0], 1)
      })
      .then(function() {
        res.redirect('/auth/verifyScucess')
      })
      .catch(qbao.QbaoError, function() {
        res.send('<html><body><script>alert(\'验证失败\')</script></body></html>')
        res.end()
      })
  })

  app.post('/auth/api/v1/regist', function(req, res) {
    var log = logger.createLogger('auth-mock')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function() {
          req.checkBody('name').notEmpty()
          req.checkBody('email').isEmail()
          req.checkBody('passwd').notEmpty()
          req.checkBody('repasswd').notEmpty()
          log.info('registe user is ' + req.body.name + ' email is ' + req.body.email)
          if (req.body.passwd !== req.body.repasswd) {
            throw new qbao.QbaoError('两次密码不一致', req.validationErrors())
          }
        })
          .then(function() {
            return dbapi.checkExist(req.body.name, req.body.email)
          })
          .then(function(cursor) {
              return cursor.toArray()
          })
          .then(function(users) {
            if(users.length > 0) {
              throw new qbao.QbaoError('用户邮箱已存在，请登陆', req.validationErrors())
            }
            var user = {
              name: req.body.name
              , email: req.body.email
              , verifycode: uuid.v1().toString().replace(/-/g, '')
              , appUrl: req.protocol + '://' + req.hostname + ':7100'
            }
            return mailutil.sendRegisteVerifyMail(user)
          })
          .then(function(verifycode) {
            log.info('用户【%s】注册发送邮件成功，注册验证码【%s】', req.body.name, verifycode)
             return dbapi.registeUser({
              name: req.body.name
              , email: req.body.email
              , ip: req.ip
              , passwd: req.body.passwd
              , verifycode: verifycode
              , isActive: 0
            })
          })
          .then(function() {
            var token = jwtutil.encode({
              payload: {
                email: req.body.email
                , name: req.body.name
              }
              , secret: options.secret
              , header: {
                exp: Date.now() + 24 * 3600
              }
            })
            res.status(200)
              .json({
                success: true
                , redirect: '/auth/mock'
                // , redirect: urlutil.addParams(options.appUrl, {
                //   jwt: token
                // })
              })
          })
          .catch(requtil.ValidationError, function(err) {
              res.status(400)
                .json({
                  success: false
                  , error: 'ValidationError'
                  , validationErrors: err.errors
                })
            })
          .catch(qbao.QbaoError, function(err) {
              res.status(400)
                .json({
                  success: false
                  , message: err.message
                  , error: 'QbaoError'
                  , validationErrors: err.errors
              })
          })
          .catch(function(err) {
              log.error('Unexpected error', err.stack)
              res.status(500)
                .json({
                  success: false
                  , error: 'ServerError'
              })
          })
        break
      default:
        res.send(406)
        break
    }
  })

  app.post('/auth/api/v1/changepasswd', function(req, res) {
    var log = logger.createLogger('auth-mock')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function() {
          req.checkBody('useremail').isEmail()
          req.checkBody('oldpasswd').notEmpty()
          req.checkBody('newpasswd').notEmpty()
          req.checkBody('renewpasswd').notEmpty()
          if (req.body.newpasswd !== req.body.renewpasswd) {
            throw new qbao.QbaoError('两次密码不一致', req.validationErrors())
          }
          if (req.body.newpasswd === req.body.oldpasswd) {
            throw new qbao.QbaoError('新旧密码不可一致', req.validationErrors())
          }
        })
          .then(function() {
            dbapi.loadUser(req.body.useremail)
              .then(function(user) {
                if(user) {
                  if(user.passwd !== req.body.oldpasswd) {
                    throw new qbao.QbaoError('旧密码错误！', req.validationErrors())
                  }
                  dbapi.updatePasswd({
                    email: req.body.useremail
                    , passwd: req.body.newpasswd
                  }).then(function(result) {
                    log.info('修改密码结果 = ' + JSON.stringify(result))
                    res.status(200)
                      .json({
                        success: true
                        , message: '修改成功'
                      })
                  })
                }
                else{
                  throw new qbao.QbaoError('用户不存在！', req.validationErrors())
                }
              })
              .catch(qbao.QbaoError, function(err) {
                res.status(400)
                  .json({
                    success: false
                    , message: err.message
                    , error: 'QbaoError'
                    , validationErrors: err.errors
                  })
              })
              .catch(function(err) {
                log.error('Unexpected error', err.stack)
                res.status(500)
                  .json({
                    success: false
                    , error: 'ServerError'
                  })
              })
          })
          .catch(requtil.ValidationError, function(err) {
            res.status(400)
              .json({
                success: false
                , error: 'ValidationError'
                , validationErrors: err.errors
              })
          })
          .catch(qbao.QbaoError, function(err) {
            res.status(400)
              .json({
                success: false
                , message: err.message
                , error: 'QbaoError'
                , validationErrors: err.errors
              })
          })
          .catch(function(err) {
            log.error('Unexpected error', err.stack)
            res.status(500)
              .json({
                success: false
                , error: 'ServerError'
              })
          })
        break
      default:
        res.send(406)
        break
    }
  })

  app.post('/auth/api/v1/mock', function(req, res) {
    var log = logger.createLogger('auth-mock')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function() {
          req.checkBody('name').notEmpty()
          req.checkBody('email').isEmail()
          req.checkBody('passwd').notEmpty()
          log.info('login user is ' + req.body.name)
        })
        .then(function() {
          log.info('Authenticated "%s"', req.body.email)
          return dbapi.checkExist(req.body.name, req.body.email)
        })
        .then(function(cursor) {
          return cursor.toArray()
        })
        .then(function(users) {
          log.info('query user size = ' + users.length)
          if (users.length > 0) {
            log.info('用户存在，校验密码')
            if (users[0].passwd !== req.body.passwd) {
              throw new qbao.QbaoError('用户名或密码错误', new Error())
            }
            if (users[0].isActive !== 1) {
              throw new qbao.QbaoError('用户尚未激活，请通过邮箱链接激活', new Error())
            }
          }
          else {
            log.info('用户不存在')
            throw new qbao.QbaoError('用户名或密码错误', new Error())
          }
          var token = jwtutil.encode({
            payload: {
              email: req.body.email
              , name: req.body.name
            }
            , secret: options.secret
            , header: {
              exp: Date.now() + 24 * 3600
            }
          })
          res.status(200)
            .json({
              success: true
              , redirect: urlutil.addParams(options.appUrl, {
                jwt: token
              })
            })
        })
          .catch(qbao.QbaoError, function(err) {
            res.status(400)
              .json({
                success: false
                , message: err.message
                , error: 'QbaoError'
                , validationErrors: err.errors
              })
          })
          .catch(requtil.ValidationError, function(err) {
            res.status(400)
              .json({
                success: false
                , error: 'ValidationError'
                , validationErrors: err.errors
              })
          })
          .catch(function(err) {
            log.error('Unexpected error', err.stack)
            res.status(500)
              .json({
                success: false
                , error: 'ServerError'
              })
          })
        break
      default:
        res.send(406)
        break
    }
  })

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
