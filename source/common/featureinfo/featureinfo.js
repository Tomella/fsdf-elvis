(function (angular, L) {
   'use strict';

   angular.module("common.featureinfo", [])

      .directive("commonFeatureInfo", ['$http', '$log', 'featureInfoService', 'flashService', function ($http, $log, featureInfoService, flashService) {
         var template = "https://elvis20161a-ga.fmecloud.com/fmedatastreaming/elvis_indexes/GetFeatureInfo_ElevationAvailableData.fmw?" +
                "SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&SRS=EPSG%3A4326&BBOX=${bounds}&WIDTH=${width}&HEIGHT=${height}&" +
                //"LAYERS=public.5dem_ProjectsIndex&" +
                //"LAYERS=public.NSW_100k_Index" +
                "LAYERS=public.NSW_100k_Index,public.5dem_ProjectsIndex" +
                "STYLES=&QUERY_LAYERS=public.5dem_ProjectsIndex&INFO_FORMAT=application%2Fjson&FEATURE_COUNT=100&X=${x}&Y=${y}";
         return {
            require: "^geoMap",
            restrict: "AE",
            link: function (scope, element, attrs, ctrl) {
               var flasher = null;

               if (typeof scope.options === "undefined") {
                  scope.options = {};
               }

               ctrl.getMap().then(function (map) {

                  map.on("click", function (event) {
                     var layer = null;
                     var size = map.getSize();
                     var point = map.latLngToContainerPoint(event.latlng, map.getZoom());
                     var latlng = event.latlng;
                     var data = {
                        x: point.x,
                        y: point.y,
                        bounds: map.getBounds().toBBoxString(),
                        height: size.y,
                        width: size.x,
                     };
                     var url = template;

                     flashService.remove(flasher);
                     flasher = flashService.add("Checking available data at this point", 5000, true);

                     angular.forEach(data, function(value, key) {
                        url = url.replace("${" + key + "}", value);
                     });

                     $http.get(url).then(function (response) {
                        map.closePopup();
                        featureInfoService.removeLastLayer(map);
                        flashService.remove(flasher);

                        if(response.data) {
                           layer = L.geoJson(response.data, {
                              style: function (feature) {
                                 return {color: "red"};
                              },
                              onEachFeature: function (feature, layer) {
                                 layer.bindPopup(
                                       "<strong>Map Title:</strong> <span title='Mapnumber: " + feature.properties.mapnumber + "'>" + feature.properties.maptitle +
                                       "</span><br/><strong>Status:</strong> " + feature.properties.status,
                                       {offset: [-10, -10]})
                                    .on('popupclose', function(e) {
                                       featureInfoService.removeLastLayer(map);
                                    });

                              }
                           }).addTo(map).openPopup();
                           featureInfoService.setLayer(layer);
                        } else {
                           L.popup()
                              .setLatLng(latlng)
                              .setContent('No data available at this location.')
                              .openOn(map);
                        }
                        scope.data = response.data;
                     });
                  });
               });
            }
         };
      }])

      .factory('featureInfoService', [function() {
         var lastFeature = null;
         return {
            setLayer: function(layer) {
               lastFeature = layer;
            },
            removeLastLayer: function(map) {
               if(lastFeature) {
                  map.removeLayer(lastFeature);
                  lastFeature = null;
               }
            }
         };
      }]);

})(angular, L);
