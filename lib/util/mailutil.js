var nodemailer = require('nodemailer')
var smtpTransport = require('nodemailer-smtp-transport')
var Promise = require('bluebird')

var mailconfig = {
  host: 'smtp.exmail.qq.com'
  , secure: true
  , secureConnection: true
  , port: 465
  , auth: {
    user: 'xiangleilei@qbao.com'
    , pass: 'HpiGycgTygJuzpZg'
  }
}

smtpTransport = nodemailer.createTransport(smtpTransport(mailconfig))

function registerVerifyMail(user) {
  return {
    from: mailconfig.auth.user
    , to: user.email
    , subject: 'QBao STF 注册'
    , html: `
    你好，${user.name}
      欢迎使用钱宝STF，点击如下链接去完成激活
      <a href="${user.appUrl}/auth/verify/${user.verifycode}"> 确认激活 </a>
      `
  }
}
function sendRegisteVerifyMail(user) {
  return send(user, registerVerifyMail(user))
}

function send(user, mail) {
  var p = new Promise(function(resolve, reject) {
    smtpTransport.sendMail(mail)
      .then(function(result) {
        resolve(user.verifycode)
      })
      .catch(function(error) {
        reject(error)
      })
  })
  return p
}

module.exports.send = send
module.exports.sendRegisteVerifyMail = sendRegisteVerifyMail

