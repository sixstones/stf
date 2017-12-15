module.exports = function MenuCtrl($scope, $rootScope, SettingsService,
  $location, UserService) {

  $scope.username = UserService.currentUser.name

  SettingsService.bind($scope, {
    target: 'lastUsedDevice'
  })

  SettingsService.bind($rootScope, {
    target: 'platform',
    defaultValue: 'native'
  })

  $scope.$on('$routeChangeSuccess', function() {
    $scope.isControlRoute = $location.path().search('/control') !== -1
  })

}
