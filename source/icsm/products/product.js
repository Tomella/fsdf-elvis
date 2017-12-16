{
   angular.module("icsm.product", ["product.download"])
      .directive("productProjection", ['productsConfigService', function(productsConfigService) {
         return {
            templateUrl : "icsm/products/projection.html",
            scope: {
               processing: "="
            },
            link: function(scope) {
               productsConfigService.config.then(config => {
                  scope.config = config;
               });
            }
         };
      }])

      .directive("productFormats", ['productsConfigService', function(productsConfigService) {
         return {
            templateUrl : "icsm/products/formats.html",
            scope: {
               processing: "="
            },
            link: function(scope) {
               productsConfigService.config.then(config => {
                  scope.config = config;
               });
               console.log("What's up doc!");
            }
         };
      }])

      .directive('productEmail', [function() {
         return {
            templateUrl: 'icsm/products/email.html',
            scope: {
               processing: "="
            }
         };
      }])

      .filter("productIntersect", function() {
         return intersecting;
      });

      function intersecting(collection, extent) {
         // The extent may have missing numbers so we don't restrict at that point.
         if(!extent || !angular.isNumber(extent.xMin) ||
               !angular.isNumber(extent.xMax) ||
               !angular.isNumber(extent.yMin) ||
               !angular.isNumber(extent.yMax)) {
            return collection;
         }

         return collection.filter(function(item) {
            // We know these have valid numbers if it exists
            if(!item.extent) {
               return true;
            }
            // We have a restriction
            return item.extent.xMin <= extent.xMin &&
               item.extent.xMax >= extent.xMax &&
               item.extent.yMin <= extent.yMin &&
               item.extent.yMax >= extent.yMax;
         });
      };
}