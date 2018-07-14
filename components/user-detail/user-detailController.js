'use strict';

cs142App.controller('UserDetailController', ['$scope', '$routeParams', '$resource',
  function ($scope, $routeParams, $resource) {
    /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    console.log("routeParams", $routeParams);
    var userId = $routeParams.userId;
    /* creates resource for the user you want details for and sets scope variables */
  /* creates resource for the whose photo you need */
    var getDetails = function(userId) {
      var url = "/user/" + userId;
      var userResource = $resource('/user/:id', {id: '@id'});
      userResource.get({id: userId}).$promise.then(function(user){
        $scope.user = user;
      }).catch(function(err){
        console.log(err);
      });
    };

    var getMostRecent = function(userId){
      var photoResource = $resource('/recentPhotoOf/:id', {id: '@id'});
      photoResource.get({id: userId}).$promise.then(function(photo){
          $scope.recentPhoto = photo;
      }).catch(function(err){
        console.log(err);
      });
    };

    var getMostCommented = function(userId){
      var photoResource = $resource('/commentedPhotoOf/:id', {id: '@id'});
      photoResource.get({id: userId}).$promise.then(function(photo){
        $scope.commentedPhoto = photo;
      }).catch(function(err){
        console.log(err);
      });
    };

    getDetails(userId);
    getMostRecent(userId);
    getMostCommented(userId);
  }]);
