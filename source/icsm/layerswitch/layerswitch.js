/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular, L) {

   'use strict';

   angular.module("icsm.layerswitch", [])

      .directive('icsmLayerswitch', ['$http', 'configService', 'mapService', function ($http, configService, mapService) {
         return {
            restrict: "AE",
            link: function (scope) {
               var config;
               var latlngs;


               configService.getConfig("layerSwitch").then(function (response) {
                  config = response;
                  $http.get(config.extentUrl, { cache: true }).then(function (response) {
                     var container = L.geoJson(response.data);
                     var layer = container.getLayers()[0];
                     if (layer) {
                        latlngs = layer.getLatLngs();
                     }

                     mapService.getMap().then(function (map) {
                        map.on("moveend", checkExtent);
                        checkExtent();

                        function checkExtent(event) {
                           var bounds = map.getBounds();
                           if (
                              insidePolygon({ lng: bounds.getWest(), lat: bounds.getSouth() }, latlngs) && // ll
                              insidePolygon({ lng: bounds.getWest(), lat: bounds.getNorth() }, latlngs) && // ul
                              insidePolygon({ lng: bounds.getEast(), lat: bounds.getSouth() }, latlngs) && // lr
                              insidePolygon({ lng: bounds.getEast(), lat: bounds.getNorth() }, latlngs)    // ur
                           ) {
                              inSpace();
                           } else {
                              outOfSpace();
                           }
                        }

                        function outOfSpace() {
                           setLayers({
                              outside: true,
                              inside: false
                           });
                        }

                        function inSpace() {
                           setLayers({
                              outside: false,
                              inside: true
                           });
                        }

                        function setLayers(settings) {
                           map.eachLayer(function (layer) {
                              if (layer.options && layer.options.switch) {
                                 if (layer.options.switch == config.inside) {
                                    layer._container.style.display = settings.inside ? "block" : "none";
                                 }
                                 if (layer.options.switch == config.outside) {
                                    layer._container.style.display = settings.outside ? "block" : "none";
                                 }
                              }
                           });
                        }
                     });

                  });
               });
            }
         };
      }]);

   function insidePolygon(latlng, polyPoints) {
      var x = latlng.lat, y = latlng.lng;

      var inside = false;
      for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
         var xi = polyPoints[i].lat, yi = polyPoints[i].lng;
         var xj = polyPoints[j].lat, yj = polyPoints[j].lng;

         var intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
         if (intersect) inside = !inside;
      }

      return inside;
   }

})(angular, L);