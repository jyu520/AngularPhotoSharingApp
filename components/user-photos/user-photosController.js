'use strict';

cs142App.controller('UserPhotosController', ['$scope', '$rootScope', '$location', '$anchorScroll','$routeParams', '$resource','$route',
  function($scope, $rootScope, $location, $anchorScroll, $routeParams, $resource, $route) {
    /*
     * Since the route is specified as '/photos/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    $scope.isUser = false;
    $scope.noPhotos = false;
    var userId = $routeParams.userId;
    
    var photoID = $routeParams.photoID;
    
    // $scope.gotoAnchor = function(photo_id) {
    //   if ($location.hash() !== photo_id) {
    //     // set the $location.hash to `newHash` and
    //     // $anchorScroll will automatically scroll to it
    //     $location.hash(photo_id);
    //   } else {
    //     // call $anchorScroll() explicitly,
    //     // since $location.hash hasn't changed
    //     $anchorScroll();
    //   }
    // };
    // $scope.gotoAnchor(photoID);

    /* creates resource for the photos you want and sets the scope variables */
    $scope.userInput = {};
    $scope.userInput.newComment = "";
    
    $scope.checkSessionUser = function(){
      var sessionResource = $resource('/sessionInfo');
      sessionResource.get(function(data){
        if (data.user_id === userId){
          $scope.isUser = true;
          $scope.currUser = data.user_id;
        }
      }, function(error){
        console.log(error);
      });
    };

    $scope.checkSessionUser();

    $scope.checkCommentPermissions = function(commentUser){
      return $scope.currUser === commentUser._id;
    };


    $scope.deletePhoto = function(photo){
      confirm("Are You Sure?");
      var photoResource = $resource('/delete/:photo_id', {photo_id: '@photo_id'});
      photoResource.save({photo_id: photo._id}, function(){
        $route.reload();
      }, function(error){
        console.log(error);
      });
    };

    $scope.deleteComment = function(photo, comment){
      confirm("Are You Sure?");
      var photoResource = $resource('/delete/:photo_id/:comment_id', {photo_id: '@photo_id', comment_id: '@comment_id'});
      photoResource.save({photo_id: photo._id, comment_id: comment._id}, function(){
        $route.reload();
      }, function(error){
        console.log(error);
      });
    };

    $scope.addComment = function(photo){
      var photoResource = $resource('/commentsOfPhoto/:photo_id', {photo_id: '@photo_id'});
      photoResource.save({comment: $scope.userInput.newComment, photo_id: photo._id}, function(){
        $rootScope.$broadcast('addComment');
      }, function(error){
        console.log(error);
      });
    };

    $scope.addFavorite = function(photo){
      var favoriteResource = $resource('/addFavorite/:photo_id', {photo_id: '@photo_id'});
      favoriteResource.save({photo_id: photo._id}, function(){
        $route.reload();
      }, function(error){
        console.log(error);
      });
    };
    
    $scope.deleteFavorite = function(photo){
      var favoriteResource = $resource('/deleteFavorite/:photo_id', {photo_id: '@photo_id'});
      favoriteResource.save({photo_id: photo._id}, function(){
        $route.reload();
      }, function(error){
        console.log(error);
      });
    };

    $scope.isFavorite = function(photo){
      return photo.favorited;
    };

    var getPhotoAlbum = function(userId){
      var photoResource = $resource('/photosOfUser/:id', {id: '@id'}, {"get":{method:"get", isArray: true}});
      photoResource.get({id: userId}).$promise.then(function(photos){
        if (photos.length < 1){
          $scope.noPhotos = true;
        }
        $scope.userPhotos = photos;
      }).catch(function(err){
        console.log(err);
      });
    };
     /* creates resource for the whose photo you need */
    var getDetails = function(userId){
      var userResource = $resource('/user/:id', {id: '@id'});
      userResource.get({id: userId}).$promise.then(function(user){
        $scope.user = user;
      }).catch(function(err){
        console.log(err);
      });
    };

    $rootScope.$on('addComment', function(){
        var photoResource = $resource('/photosOfUser/:id', {id: '@id'}, {"get":{method:"get", isArray: true}});
        photoResource.get({id: userId}).$promise.then(function(photos){
          $scope.userPhotos = photos;
          $route.reload();
        }).catch(function(err){
          console.log(err);
        });
    });

    getDetails(userId);

    getPhotoAlbum(userId);

  }]);
