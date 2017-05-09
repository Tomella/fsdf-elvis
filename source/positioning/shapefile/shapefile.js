{
   class ShpService {
      constructor($q) {
         this.$q = $q;
      }
   }
   ShpService.$invoke = ["$q"];

   angular.module("positioning.shp", [])

      .directive("shpFile", ["shpService", function (shpService) {
         return {
            templateUrl: "positioning/shapefile/shapefile.html",
            restrict: 'AE',
            scope: {
               state: "=",
               settings: "="
            },
            link: function(scope) {

            }
         };
      }])

      .service("shpService", ShpService);
}