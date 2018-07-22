{
   angular.module("placenames.summary", [])

   .directive("placenamesSummary", ['$document', "$rootScope", "mapService", ($document, $rootScope, mapService) => {
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
                  scope.marker = L.marker(scope.latLng, {
                     icon: L.icon({
                        iconUrl: 'icsm/resources/img/marker-icon-red.png',
                        iconSize: [25,41],
                        iconAnchor: [13, 41]
                     })}
                  ).addTo(map);
               });
            });

            scope.remove = () => {
               if(scope.marker) scope.marker.remove();
               scope.item = scope.marker = null;
            };

            scope.close = () => {
               scope.remove();
            };

            $document.on('keydown', function keyupHandler(keyEvent) {
               if (keyEvent.which === 27) {
                  scope.$apply(function () {
                     scope.remove();
                  });
               }
            });
         }
      }
   }]);
}