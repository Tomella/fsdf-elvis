(function (angular, L) {
   'use strict';

   angular.module("common.featureinfo", [])

      .directive("commonFeatureInfo", ['$http', '$log', '$q', 'featureInfoService', 'flashService', function ($http, $log, $q, featureInfoService, flashService) {
         var template = "https://elvis20161a-ga.fmecloud.com/fmedatastreaming/elvis_indexes/GetFeatureInfo_ElevationAvailableData.fmw?" +
                "SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&SRS=EPSG%3A4326&BBOX=${bounds}&WIDTH=${width}&HEIGHT=${height}&" +
                //"LAYERS=public.5dem_ProjectsIndex&" +
                "LAYERS=public.NSW_100k_Index&" +
                //"LAYERS=public.5dem_ProjectsIndex,public.NSW_100k_Index&&cql_Filter=;&" +
                "STYLES=&QUERY_LAYERS=public.5dem_ProjectsIndex&INFO_FORMAT=application%2Fjson&FEATURE_COUNT=100&X=${x}&Y=${y}&LAYERS=";
         var layers = ["public.5dem_ProjectsIndex", "public.NSW_100k_Index"];

         return {
            require: "^geoMap",
            restrict: "AE",
            link: function (scope, element, attrs, ctrl) {
               var flasher = null;

               if (typeof scope.options === "undefined") {
                  scope.options = {};
               }

               ctrl.getMap().then(function (map) {
                  map.on('popupclose', function(e) {
                     featureInfoService.removeLastLayer(map);
                  });

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
                        width: size.x
                     };
                     var url = template;

                     flashService.remove(flasher);
                     flasher = flashService.add("Checking available data at this point", 5000, true);

                     angular.forEach(data, function(value, key) {
                        url = url.replace("${" + key + "}", value);
                     });

                     $q.all(layers.map(layer => $http.get(url + layer))).then(function (responses) {
                        var group = responses.filter(response => response.data);
                        var response;
                        var popupText = [];

                        map.closePopup();
                        featureInfoService.removeLastLayer(map);
                        flashService.remove(flasher);

                        if(!group.length) {
                           response = responses[0]; // They are the same anyway
                           popupText.push('No data available at this location.');
                        } else {
                           response = {
                              data: {
                                 name: "public.AllIndexes",
                                 type: "FeatureCollection",
                                 crs: {
                                    type: "name",
                                    properties: {
                                       name: "EPSG:4326"
                                    }
                                 },
                                 features: []
                              }
                           };

                           let features = response.data.features;

                           group.forEach(response => {
                              response.data.features.forEach(feature => {
                                 features.push(feature);
                                 if(feature.properties.maptitle) {
                                    popupText.push(
                                       "<strong>Map Title:</strong> <span title='Map number: " + feature.properties.mapnumber + "'>" + feature.properties.maptitle +
                                       "</span><br/><strong>Status:</strong> " + feature.properties.status);
                                 } else {
                                    /*
                                          object_name : "middledarling2014_z55.tif",
                                          object_url : "https://s3-ap-southeast-2.amazonaws.com/elvis.ga.gov.au/elevation/5m-dem/mdba/QG/middledarling2014_z55.tif",
                                          object_size : "5577755073",
                                          object_last_modified : "20161017",
                                          area : "5560.00",
                                          status : "Available"
                                    */
                                    popupText.push(
                                       "<strong>File name:</strong> " + feature.properties.object_name +
                                       "</span><br/><strong>Status:</strong> " + feature.properties.status);
                                 }
                              });
                           });
                        }

                        if(response.data) {
                           layer = L.geoJson(response.data, {
                              style: function (feature) {
                                 return {
                                    fillOpacity: 0.1,
                                    color: "red"
                                 };
                              }
                           }).addTo(map)
                           .openPopup()
                           .on('popupclose', function() {
                              featureInfoService.removeLastLayer(map);
                           });
                           featureInfoService.setLayer(layer);
                        }

                        L.popup()
                           .setLatLng(latlng)
                           .setContent("<div class='fi-popup'>" + popupText.join("<hr/>") + "</div>")
                           .openOn(map);
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
