{
   angular.module("products.bbox", [])

      .directive("productsBboxButton", ['productsBboxService', function (productsBboxService) {
         return {
            templateUrl: "icsm/products/bbox.html",
            scope: {
               data: "="
            },
            link: function (scope) {
               scope.toggle = function () {
                  scope.data.hasBbox = !scope.data.hasBbox;
                  if (scope.data.hasBbox) {
                     productsBboxService.show(scope.data);
                  } else {
                     productsBboxService.hide(scope.data);
                  }
               };
            }
         };
      }])

      .factory("productsBboxService", ['productsMapUtilsService', function (productsMapUtilsService) {
         var service = {};

         service.show = function (data) {
            if (!data.boundsLayer) {
               let bounds = productsMapUtilsService.bboxToBounds(data.bbox);
               data.boundsLayer = productsMapUtilsService.createBounds(bounds);
            }
            productsMapUtilsService.showLayer(data.boundsLayer, true);
         };

         service.hide = function (data) {
            if (data.boundsLayer) {
               productsMapUtilsService.hideLayer(data.boundsLayer);
            }
         };

         return service;
      }])

      .factory("productsMapUtilsService", ['mapService', function (mapService) {
         const normalLayerColor = "#ff7800",
            hilightLayerColor = 'darkblue';

         var service = {};

         service.createGroup = function () {
            return mapService.getMap().then(map => {
               var layer = L.layerGroup();
               map.addLayer(layer);
               return layer;
            });
         };

         service.removeGroup = function (group) {
            mapService.getMap().then(map => {
               map.removeLayer(group);
            });
         };


         service.showLayer = function (layer, zoom) {
            mapService.getMap().then(map => {
               layer.addTo(map);
               if (zoom) {
                  map.fitBounds(layer.getBounds());
               }
            });
         };

         service.hideLayer = function (layer) {
            mapService.getMap().then(map => {
               map.removeLayer(layer);
            });
         };

         service.createBounds = function (bounds, config = { fill: false, color: normalLayerColor, weight: 2, opacity: 0.8 }) {
            // create a rectangle
            return L.rectangle(bounds, config);
         };

         service.bboxToBounds = function (bbox) {
            // "113.760230 -45.949852 162.000033 -9.205568"
            var parts = bbox.split(" ");

            return [[+parts[3], +parts[0]], [+parts[1], +parts[2]]];
         };

         return service;
      }]);;

}