module.exports =
  function UserCtrl($scope,UserService,$http,$timeout) {
    $scope.toChangePassWd = false
    $scope.user = UserService.currentUser
    $scope.toggleChangePassword = function () {
      if($scope.toChangePassWd){
        $scope.error = null
        $scope.success = false
        $scope.toChangePassWd = false
        $scope.reset()
      }else {
        $scope.error = null
        $scope.success = false
        $scope.toChangePassWd = true
        $scope.reset()
      }
    }
    $scope.reset = function() {
      $scope.oldpasswd = ''
      $scope.newpasswd = ''
      $scope.renewpasswd = ''
    }

    $scope.changePassword = function() {
      var data = {
        useremail: $scope.user.email,
        oldpasswd: $scope.oldpasswd,
        newpasswd: $scope.newpasswd,
        renewpasswd: $scope.renewpasswd
      }

      $http.post('/auth/api/v1/changepasswd', data)
        .success(function(response) {
          $scope.success = true
          $scope.reset()
          $timeout(function() {
            $scope.toChangePassWd = false
          }, 1000)
        })
        .error(function(response) {
          switch (response.error) {
            case 'QbaoError':
              $scope.error = {
                $invalid: true,
                $message: response.message
              }
              break
            default:
              $scope.error = {
                $server: true,
                $message: '系统异常'

              }
              break
          }
        })
    }
  }
