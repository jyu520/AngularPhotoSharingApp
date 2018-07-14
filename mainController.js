'use strict';

var cs142App = angular.module('cs142App', ['ngRoute', 'ngMaterial', 'ngResource']);

cs142App.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
            when('/users', {
                templateUrl: 'components/user-list/user-listTemplate.html',
                controller: 'UserListController'
            }).
            when('/users/:userId', {
                templateUrl: 'components/user-detail/user-detailTemplate.html',
                controller: 'UserDetailController'
            }).
            when('/photos/:userId', {
                templateUrl: 'components/user-photos/user-photosTemplate.html',
                controller: 'UserPhotosController'
            }).
            when('/login-register', {
                templateUrl: 'components/login-register/login-registerTemplate.html',
                controller: 'LoginRegisterController'
            }).
            when('/favorite', {
                templateUrl: 'components/favorite-view/favorite-viewTemplate.html',
                controller: 'FavoriteViewController'
            }).
            otherwise({
                redirectTo: '/user/'
            });
    }]);

cs142App.run(function($rootScope, $location, $anchorScroll, $routeParams) {
    //when the route is changed scroll to the proper element.
    $rootScope.$on('$routeChangeSuccess', function(newRoute, oldRoute) {
    $location.hash($routeParams.scrollTo);
    $anchorScroll();  
    });
});

cs142App.controller('MainController', ['$scope', '$rootScope', '$location', '$http', '$resource', '$route',
    function ($scope, $rootScope, $location, $http, $resource, $route) {
        $scope.main = {};
        $scope.main.title = 'Not Logged In';
        
        $scope.main.tool_left = "Jeffrey Yu";

        $scope.loginProfile = {};
        $scope.loginProfile.loggedIn = false;

        $scope.main.homeClick = function(){
            $location.path("/user");
        };

        $scope.deleteUser = function(){
            confirm("Are you sure you want to delete your account?");
            var deleteResource = $resource('/delete');
            deleteResource.save({}).$promise.then(function(){
                alert("Account successfully deleted.");
                $rootScope.$broadcast('delete-user');
                $location.path("/login-register");
                $route.reload();
            }).catch(function(error){
                console.log(error);
            });
        };

        var logoutResource = $resource('/admin/logout');
        $scope.main.logoutClick = function(){
            logoutResource.save({}).$promise.then(function(obj){
                $scope.loginProfile.loggedIn = false;
                $scope.main.title= "Not Logged In";
                $rootScope.$broadcast('logout');
                $location.path("/login-register");
            });

        };

        var selectedPhotoFile;   // Holds the last file selected by the user

        // Called on file selection - we simply save a reference to the file in selectedPhotoFile
        $scope.inputFileNameChanged = function (element) {
            selectedPhotoFile = element.files[0];
            $scope.uploadPhoto();
            $route.reload();
        };

        // Has the user selected a file?
        $scope.inputFileNameSelected = function () {
            return !!selectedPhotoFile;
        };

        // Upload the photo file selected by the user using a post request to the URL /photos/new
        $scope.uploadPhoto = function () {
            if (!$scope.inputFileNameSelected()) {
                console.error("uploadPhoto called will no selected file");
                return;
            }
            console.log('fileSubmitted', selectedPhotoFile);

            // Create a DOM form and add the file to it under the name uploadedphoto
            var domForm = new FormData();
            domForm.append('uploadedphoto', selectedPhotoFile);

            // Using $http to POST the form
            $http.post('/photos/new', domForm, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).then(function successCallback(response){
                $route.reload();
            }, function errorCallback(response){
            
                console.error('ERROR uploading photo', response);
            });

        };

        $scope.main.version = 0;

        $scope.updateVer = function(){
            var testResource = $resource('/test/info');
            testResource.get({}).$promise.then(function(obj){
                $scope.main.version = obj.version;
            });
        };
        
        $scope.updateVer();

        $rootScope.$on( "$routeChangeStart", function(event, next, current) {
            if ($scope.loginProfile.loggedIn === false) {
                // no logged user, redirect to /login-register unless already there
                if (next.templateUrl !== "components/login-register/login-registerTemplate.html") {
                    $location.path("/login-register");
                }
            }
        });

    }]);
