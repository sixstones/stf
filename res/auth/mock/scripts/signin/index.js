require('./signin.css')

module.exports = angular.module('stf.signin', [])
  .config(function($routeProvider) {
    $routeProvider
      .when('/auth/mock/', {
        template: require('./signin.pug')
      })
      .when('/auth/registe/', {
        template: require('./registe.pug')
      })
  })
  .controller('SignInCtrl', require('./signin-controller'))
