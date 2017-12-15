require('./user.css')
module.exports = angular.module('stf.user-profile', [
  require('stf/user').name
])
  .config(function($routeProvider) {

    $routeProvider
      .when('/user', {
        template: require('./user.pug')
      })
  })
  .controller('UserProfileCtrl', require('./user-controller'))
