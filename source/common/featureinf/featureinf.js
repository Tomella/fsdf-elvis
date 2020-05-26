{
   angular.module("common.featureinf", [])

      .directive("commonFeatureInf", ['$http', '$log', '$q', '$timeout', 'featureInfService', 'flashService', 'mapService', 'messageService',
         function ($http, $log, $q, $timeout, featureInfoService, flashService, mapService, messageService) {
            var template = "https://elvis2018-ga.fmecloud.com/fmedatastreaming/elvis_indexes/GetFeatureInfo_ElevationAvailableData.fmw?" +
               "SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&SRS=EPSG%3A4326&BBOX=${bounds}&WIDTH=${width}&HEIGHT=${height}" +
               //"LAYERS=public.5dem_ProjectsIndex&" +
               "&LAYERS=public.QLD_Elevation_Metadata_Index,public.ACT2015-Tile_Index_55,public.5dem_ProjectsIndex,public.NSW_100k_Index_54,public.NSW_100k_Index_55," +
               "public.NSW_100k_Index_56,public.NSW_100k_Index_Forward_Program,public.QLD_Project_Index_54," +
               "public.QLD_Project_Index_55,public.QLD_Project_Index_56,public.TAS_Project_Index_55," +
               "public.GA_Project_Index_47,public.GA_Project_Index_48,public.GA_Project_Index_54," +
               "public.GA_Project_Index_55,public.GA_Project_Index_56" +
               "&STYLES=&INFO_FORMAT=application%2Fjson&FEATURE_COUNT=100&X=${x}&Y=${y}";
            var layers = ["public.5dem_ProjectsIndex", "public.NSW_100k_Index"];

            return {
               restrict: "AE",
               templateUrl: "common/featureinf/featureinf.html",
               link: function (scope, element, attrs, ctrl) {
                  var flasher = null;
                  scope.features = null;
                  scope.captured = captured;
                  scope.formatDate = formatDate;

                  if (typeof scope.options === "undefined") {
                     scope.options = {};
                  }

                  mapService.getMap().then(function (map) {
                     map.on('popupclose', function (e) {
                        featureInfoService.removeLastLayer(map);
                     });

                     scope.close = function() {
                        featureInfoService.removeLastLayer(map);
                        featureInfoService.removePolygon();
                        scope.features = null;
                     }
   
                     scope.entered = function(feature) {
                        featureInfoService.showPolygon(map, feature);

                     }

                     scope.left = function(feature) {
                        featureInfoService.removePolygon();
                     }

                     map.on("draw:drawstart point:start", function () {
                        scope.paused = true;
                     });

                     map.on("draw:drawstop point:end", function () {
                        // Argh. Can't get an event that runs before the click on draw but
                        // if I wait a few milliseconds then all is good.
                        $timeout(function () {
                           scope.paused = false;
                        }, 6);
                     });

                     map.on("click", function (event) {
                        if (scope.paused) {
                           return;
                        }
                        console.log("clicked feature info");

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
                        flasher = flashService.add("Checking available data at this point", 30000, true);

                        angular.forEach(data, function (value, key) {
                           url = url.replace("${" + key + "}", value);
                        });

                        $http.get(url).then(function (httpResponse) {
                           let group = httpResponse.data;
                           let response;
                           var features;

                           console.log(group);

                           featureInfoService.removeLastLayer(map);
                           flashService.remove(flasher);

                           if (!group.length) {
                              flasher = flashService.add("No status information available for this point.", 4000);
                              response = httpResponse;
                              scope.features = null;
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
                              features = response.data.features;

                              group.forEach(response => {
                                 response.features.forEach(feature => {
                                    features.push(feature);
                                    let contact = feature.properties.contact;
                                    if(contact) {
                                       feature.properties.contact = 
                                             contact.toLowerCase().indexOf("mailto:") === 0 ? "" : "mailto:" + 
                                             contact;
                                    }
                                 });
                              });

                              scope.features = features;

                              if (features.length) {
                                 layer = L.geoJson(response.data, {
                                    style: function (feature) {
                                       return {
                                          fillOpacity: 0.1,
                                          color: "red"
                                       };
                                    }
                                 }).addTo(map);
                                 featureInfoService.setLayer(layer);
                                 if(features.length < 3) {
                                    scope.d1Height = "fi-d1x" + features.length;
                                 } else {
                                    scope.d1Height = "fi-d1xb"
                                 }
                              }
                           }
                        });
                     });
                  });
               }
            };
         }])

      .factory('featureInfService', [function () {
         var lastFeature = null;
         var polygon = null;
         return {
            setLayer: function (layer) {
               lastFeature = layer;
            },
            removeLastLayer: function (map) {
               if (lastFeature) {
                  map.removeLayer(lastFeature);
                  lastFeature = null;
               }
            },

            showPolygon: function(map, feature) {
               polygon = L.geoJson( { 
                  type: "FeatureCollection",
                  features: [feature]
               }, {color: 'green'}).addTo(map);
            },

            removePolygon: function() {
               if(polygon) {
                  polygon.remove();
                  polygon = null;
               }
            }
         };
      }]);


   function captured(twoDates) {
      let dates = twoDates.split(" - ");
      if (dates.length !== 2) {
         return twoDates;
      }

      return formatDate(dates[0]) + " - " + formatDate(dates[1]);
   }

   function formatDate(data) {
      if (data.length !== 8) {
         return data;
      }
      return data.substr(0, 4) + "/" + data.substr(4, 2) + "/" + data.substr(6, 2);
   }
}
