{
   angular.module("placenames.summary", [])

   .directive("placenamesSummary", ["$rootScope", "mapService", ($rootScope, mapService) => {
      return {
         restrict: "AE",
         templateUrl: "placenames/summary/summary.html",
         link: (scope) => {
            $rootScope.$on("search.button.fired", (event, item) => {
               console.log("item", item);
               scope.remove();

               scope.item = item;
               scope.latLng = item.location.split(" ").map(num => +num).reverse();
               mapService.getMap().then(map => {
                  scope.marker = L.marker(scope.latLng).addTo(map);
               });

            });

            scope.remove = () => {
               if(scope.marker) scope.marker.remove();
               scope.item = scope.marker = null;
            };

            scope.close = () => {
               scope.remove();
            };
         }
      }
   }]);
}