'use strict';

cs142App.controller('UserListController', ['$scope', '$rootScope', '$resource',
    function ($scope, $rootScope, $resource) {
        /* creates resource for the user list and sets scope variable */
        $scope.main.title = 'Users';
        $rootScope.$on('login', function(){
            var userListResource = $resource('/user/list', {}, {"get":{method:"get", isArray: true}});
            userListResource.get({}).$promise.then(function(userList){
                $scope.users = userList;
            }).catch(function(err){
                console.log(err);
            });
        });

        $rootScope.$on('logout', function(){
            $scope.users = [];
        });

        $rootScope.$on('delete-user', function(){
            $scope.users = [];
        });


    }]);

