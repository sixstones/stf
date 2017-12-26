module.exports = function SignInCtrl($scope, $http, $interval) {
  $scope.error = null
  $scope.toRegiste = function() {
    location.replace('/auth/registe/')
  }

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

  $scope.registe = function() {
    var data = {
      name: $scope.signin.username.$modelValue,
      email: $scope.signin.email.$modelValue,
      passwd: $scope.signin.passwd.$modelValue,
      repasswd: $scope.signin.repasswd.$modelValue
    }
    $scope.invalid = false
    $http.post('/auth/api/v1/regist', data)
      .success(function(response) {
        $scope.error = null
        $scope.success = true
        $scope.startTimeCount()
    })
      .error(function(response) {
        switch (response.error) {
          case 'ValidationError':
            $scope.error = {
              $invalid: true
            }
            break
          case 'QbaoError':
            $scope.message = response.message
            $scope.error = {
              $qbaoError: true
            }
            break
          default:
            $scope.error = {
              $server: true
            }
            break
        }
      })
  }

  $scope.submit = function() {
    var data = {
      name: $scope.signin.username.$modelValue,
      email: $scope.signin.email.$modelValue,
      passwd: $scope.signin.passwd.$modelValue
    }
    $scope.invalid = false
    $http.post('/auth/api/v1/mock', data)
      .success(function(response) {
        $scope.error = null
        location.replace(response.redirect)
      })
      .error(function(response) {
        switch (response.error) {
          case 'ValidationError':
            $scope.error = {
              $invalid: true
            }
            break
          case 'QbaoError':
            $scope.message = response.message
            $scope.error = {
              $qbaoError: true
            }
            break
          default:
            $scope.error = {
              $server: true
            }
            break
        }
      })
  }
}
