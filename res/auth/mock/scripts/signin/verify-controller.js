module.exports = function VerifyCtrl($scope, $interval) {
  $scope.timeLeft = 5

  $scope.startTimeCount = function() {
    $interval(function() {
      $scope.timeLeft --
    }, 1000, $scope.timeLeft)
    .then(function() {
        if($scope.timeLeft < 1) {
          location.replace('/auth/mock/')
        }
    })
  }
}
