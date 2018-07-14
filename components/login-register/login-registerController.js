"use strict";

cs142App.controller('LoginRegisterController', ['$scope', '$rootScope', '$location', '$resource',

    function ($scope,  $rootScope, $location, $resource) {

        var loginResource = $resource('/admin/login');
        $scope.error = {};
        $scope.submitLogin = function(){
            $scope.wrongData = false;
            loginResource.save({login_name: $scope.name, password: $scope.password}).$promise.then(function(userData){
                $scope.loginProfile.name = userData.first_name;
                $scope.main.title = "Hi " + userData.first_name;
                $scope.loginProfile.loggedIn = true;
                $rootScope.$broadcast('login');
                window.location.href = "#!/users/" + userData._id;
            }).catch(function(error){
                alert(error.data);
                $scope.wrongData = true;
                $scope.errMsg = error.data;
                $scope.name = "";
                $scope.password = "";
            });
        };

        $scope.registerMe = function(){
            $scope.registrationCompleted = false;
            // get first and last name
            
            if($scope.first_name){
                $scope.first_name = $scope.first_name.trim();
            }

            if($scope.last_name){
                $scope.last_name = $scope.last_name.trim();
            }
            

            if ($scope.user_name === undefined) {
                alert('Error: Please enter valid username');
            } else if ($scope.user_name.trim() === "") {
                alert('Error: Please enter valid username');
            } else if ($scope.first_name === undefined) {
                alert('Error: Please enter valid first name');
            } else if ($scope.first_name.trim() === "") {
                alert('Error: Please enter valid first name');
            } else if ($scope.last_name === undefined) {
                alert('Error: Please enter valid last name');
            } else if ($scope.last_name.trim() === "") {
                alert('Error: Please enter valid last name');
            } else if ($scope.newPassword !== $scope.verifyNewPassword) {
                alert('Error: Passwords do not match');
                $scope.newPassword = "";
                $scope.verifyNewPassword = "";

            } else {
                alert("registering account");
                var Register = $resource('/user');
                Register.save({
                    login_name: $scope.user_name,
                    password: $scope.newPassword,
                    first_name: $scope.first_name.trim(),
                    last_name: $scope.last_name.trim(),
                    location: $scope.location,
                    description: $scope.description,
                    occupation: $scope.occupation
                }, function () {
                    $scope.registrationCompleted = true;
                    $scope.first_name = "";
                    $scope.last_name = "";
                    $scope.user_name = "";
                    $scope.newPassword = "";
                    $scope.verifyNewPassword = "";
                    $scope.location = "";
                    $scope.description = "";
                    $scope.occupation = "";

                }, function errorHandling(err) {
                    alert(err.data);
                    $scope.user_name = "";
                });
            }
        };
    }]);

