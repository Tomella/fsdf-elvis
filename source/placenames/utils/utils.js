(function (angular) {

   'use strict';

   angular.module("placenames.utils", [])

      .filter("pnSplitBar", function () {
         return function (val) {
            var buffer = "";
            (val ? val : "").split("|").forEach((name, index, variants) => {
               buffer += (index && index < variants.length - 1 ? "," : "") + " ";
               if (index && index === variants.length - 1) {
                  buffer += "or ";
               }
               buffer += name;
            });
            return buffer;
         };
      })

      .filter('pnFeature', ['configService', function (configService) {
         var features;
         configService.getConfig("classifications").then(classifications => {
            features = classifications;
         });
         return function (str) {
            return features? features[str]: str;
         };
      }])

      .factory('placenamesUtilsService', ['configService', function (configService) {

         var service = {};


         return service;
      }]);

})(angular);
