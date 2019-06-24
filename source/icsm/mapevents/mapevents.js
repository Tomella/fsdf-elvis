{

   angular.module("icsm.mapevents", ['geo.map'])

      .directive('icsmMapevents', ['icsmMapeventsService', function (icsmMapeventsService) {
         return {
            restrict: 'AE',
            link: function (scope) {
               icsmMapeventsService.tickle();
            }
         };
      }])

      .factory('icsmMapeventsService', ['$rootScope', '$timeout', 'configService', 'mapService',
         function ($rootScope, $timeout, configService, mapService) {
            var marker, poly, bounds;
            var config = configService.getConfig("mapConfig");

            // We want to propagate the events from the download function so that it ripples through to other
            // parts of the system, namely the clip functionality.
/*
            $rootScope.$on('ed.clip.extent.change.out', function showBbox(event, data) {
               console.log("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
            });


            $rootScope.$on('ed.clip.extent.change.in', function showBbox(event, data) {
               console.log("GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGE");
            });
*/

            $rootScope.$on('icsm.bounds.draw', function showBbox(event, bbox) {
               // 149.090045383719,-35.4,149.4,-35.3
               if (!bbox) {
                  makeBounds(null);
                  return;
               }

               var xmax = bbox[2],
                  xmin = bbox[0],
                  ymax = bbox[3],
                  ymin = bbox[1];

               // It's a bbox.
               makeBounds({
                  type: "Feature",
                  geometry: {
                     type: "Polygon",
                     coordinates: [
                        [[xmin, ymin], [xmax, ymin], [xmax, ymax],
                        [xmin, ymax], [xmin, ymin]]
                     ]
                  },
                  properties: {}
               }, false);
            });

            $rootScope.$on('icsm.bbox.draw', function showBbox(event, bbox) {
               // 149.090045383719,-35.4,149.4,-35.3
               if (!bbox) {
                  makePoly(null);
                  return;
               }

               var xmax = bbox[2],
                  xmin = bbox[0],
                  ymax = bbox[3],
                  ymin = bbox[1];

               // It's a bbox.
               makePoly({
                  type: "Feature",
                  geometry: {
                     type: "Polygon",
                     coordinates: [
                        [[xmin, ymin], [xmax, ymin], [xmax, ymax],
                        [xmin, ymax], [xmin, ymin]]
                     ]
                  },
                  properties: {}
               }, false);
            });
            $rootScope.$on('icsm.poly.draw', function showBbox(event, geojson) {
               // It's a GeoJSON Polygon geometry and it has a single ring.
               makePoly(geojson, true);
            });

            if (config.listenForMarkerEvent) {
               $rootScope.$on(config.listenForMarkerEvent, function showBbox(event, geojson) {
                  // It's a GeoJSON Polygon geometry and it has a single ring.
                  makeMarker(geojson);
               });
            }

            function makeMarker(data) {
               mapService.getMap().then(function (map) {
                  if (marker) {
                     map.removeLayer(marker);
                  }
                  if (!data) {
                     return;
                  }

                  var point;
                  if (typeof data.properties.SAMPLE_LONGITUDE !== "undefined") {
                     point = {
                        type: "Point",
                        coordinates: [
                           data.properties.SAMPLE_LONGITUDE,
                           data.properties.SAMPLE_LATITUDE
                        ]
                     };
                  } else {
                     point = data.geometry;
                  }

                  marker = L.geoJson({
                     type: "Feature",
                     geometry: point,
                     id: data.id
                  }).addTo(map);

                  if (data.properties.html) {
                     marker.bindPopup(data.properties.html).openPopup();
                  }
               });
            }

            function makePoly(data, zoomTo) {
               mapService.getMap().then(function (map) {
                  if (poly) {
                     map.removeLayer(poly);
                  }

                  if (data) {
                     poly = L.geoJson(data, {
                        style: function (feature) {
                           return {
                              opacity: 1,
                              clickable: false,
                              fillOpacity: 0,
                              color: "red"
                           };
                        }
                     }).addTo(map);

                     if (zoomTo) {
                        $timeout(function () {
                           var bounds = poly.getBounds();
                           map.fitBounds(bounds, {
                              animate: true,
                              padding: L.point(100, 100)
                           });
                        }, 50);
                     }
                  }
               });
            }

            function makeBounds(data, zoomTo) {
               mapService.getMap().then(function (map) {
                  if (bounds) {
                     map.removeLayer(bounds);
                  }

                  if (data) {
                     bounds = L.geoJson(data, {
                        style: function (feature) {
                           return {
                              opacity: 1,
                              clickable: false,
                              fillOpacity: 0,
                              color: "black"
                           };
                        }
                     }).addTo(map);

                     if (zoomTo) {
                        $timeout(function () {
                           var boundingBox = bounds.getBounds();
                           map.fitBounds(boundingBox, {
                              animate: true,
                              padding: L.point(100, 100)
                           });
                        }, 50);
                     }
                  }
               });
            }

            function clip(num, min, max) {
               return Math.min(Math.max(num, min), max);
            }

            return {
               tickle: function () {
                  mapService.getMap().then(function (map) {
                     map.on('click', function (event) {
                        var zoom = map.getZoom();
                        var latlng = event.latlng;
                        $rootScope.$broadcast("zoom.to", {
                           zoom: zoom,
                           latlng: latlng
                        });
                     });
                  });
               }
            };
         }]);
}