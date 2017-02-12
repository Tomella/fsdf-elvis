(function (angular) {

   'use strict';

   angular.module("placenames.utils", [])

      .filter("pnSplitBar", function () {
         return function (val = "") {
            var buffer = "";
            val.split("|").forEach((name, index, variants) => {
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
         configService.getConfig("featureCodes").then(featureCodes => {
            features = featureCodes;
         });
         return function (str) {
            return features? features[str]: str;
         };
      }])

      .filter("pnGoogleLink", function() {
         var template = "https://www.google.com.au/maps/place/${name}/@${lat},${lng},14z";
         return function(what) {
            if(!what) return "";
            let location = what.location.split(" ");

            return template
               .replace("${name}", what.name)
               .replace("${lng}", location[0])
               .replace("${lat}", location[1]);
         };
      })

      .factory('pnUtilsService', ['configService', function (configService) {
         var service = {};

         return service;
      }]);

})(angular);
