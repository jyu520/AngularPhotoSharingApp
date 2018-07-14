'use strict';

cs142App.controller('FavoriteViewController', ['$scope', '$rootScope', '$location', '$routeParams', '$route', '$mdDialog', '$resource',
  function($scope, $rootScope, $location, $routeParams, $route, $mdDialog, $resource) {
    // un- favorite photo
    $scope.deleteFavorite = function(photo){
      var favoriteResource = $resource('/deleteFavorite/:photo_id', {photo_id: '@photo_id'});
      favoriteResource.save({photo_id: photo._id}, function(){
        $route.reload();
      }, function(error){
        console.log(error);
      });
    };
    // gets list of fav photos for session user
    $scope.getFavorites = function(){
      var favoriteResource = $resource('/getFavorites', {}, {"get":{method:"get", isArray: true}});
      favoriteResource.get(function(favorites){
        $scope.favoritePictures = favorites;
      }, function(error){
        console.log(error);
      });
    };

    $scope.getFavorites();
    // opens modal with picture and timestamp
    $scope.openModal = function($event, photo){
      $mdDialog.show({
        clickOutsideToClose: true,
        scope: $scope,       
        preserveScope: true, 
        template: '<md-dialog>' +
                  '  <md-dialog-content>' +
                  '    <img ng-src="/images/' + photo.file_name + '">' + 
                  '    <p>Date Taken: ' + photo.date_time + '</p>' +
                  '  </md-dialog-content>' +
                  '</md-dialog>',
        controller: function DialogController($scope, $mdDialog) {
          $scope.closeDialog = function() {
            $mdDialog.hide();
          };
        }
     });
    };


    }]);

