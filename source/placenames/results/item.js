(function (angular) {

   'use strict';

   angular.module("placenames.results.item", [])

      .directive("placenamesResultsItem", ['placenamesResultsService', function (placenamesResultsService) {
         return {
            templateUrl: "placenames/results/item.html",
            bindToController: {
               item: "="
            },
            controller: function () {
               this.showPan = function(feature) {
                  placenamesResultsService.showPan(feature);
               };
               placenamesResultsService.load(this.item.id).then(data => {
                  this.feature = data.features[0];
               });
            },
            controllerAs: "vm"
         };
      }])

      .factory('placenamesItemService', ['mapService', function (mapService) {

         var service = {};


         return service;
      }]);

})(angular);
