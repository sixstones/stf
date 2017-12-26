var crypto = require('crypto')
var uuid = require('uuid')
function creatPassWord(passwd, salt) {
  var hasher = crypto.createHash('md5')
  return hasher.update(passwd.toString() + salt.toString()).digest('hex')
}

module.exports.creatPassWord = creatPassWord

