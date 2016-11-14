/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("icsm.layerswitch", [])

.directive('icsmLayerswitch', ['$http', 'configService', 'mapService', function($http, configService, mapService) {
   return {
      restrict: "AE",
      link: function(scope) {
         configService.getConfig("layerSwitch").then(function(config){

            $http.get(config.extentUrl, {cache: true}).then(function(response) {
               console.log(response.data);
            });
         });


      }
   };
}]);

})(angular);