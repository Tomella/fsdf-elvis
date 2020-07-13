/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */
/**
 * This version relies on 0.0.4+ of explorer-path-server as it uses the URL for intersection on the artesian basin plus the actual KML
 */
/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */
/**
 * This version relies on 0.0.4+ of explorer-path-server as it uses the URL for intersection on the artesian basin plus the actual KML
 */
{

    angular.module("temp.elevation", [
       'graph',
       'explorer.crosshair',
       'explorer.flasher',
       'geo.map',
       'geo.path'])
 
       .directive("pathElevationPlot", ['$log', '$timeout', '$rootScope', '$filter', 'elevationService', 'crosshairService',
          function ($log, $timeout, $rootScope, $filter, elevationService, crosshairService) {
             var WIDTH = 1000,
                HEIGHT = 90,
                elevationStyle = {
                   fill: "orange",
                   fillOpacity: 0.4,
                   stroke: "darkred",
                   strokeWidth: 1.5
                },
                infoLoading = '<span><img alt="Waiting..." src="resources/img/tinyloader.gif" ng-show="message.spinner" style="position:relative;top:2px;" width="12"></img></span>';
 
             return {
                templateUrl: "icsm/tempelevation/elevation.html",
                scope: true,
                controller: ['$scope', function ($scope) {
                   $scope.paths = [];
                   $scope.config = {
                      xLabel: "Distance: 3000m"
                   };
 
                   $rootScope.$on("elevation.plot.data", function (event, data) {
                      $scope.length = data.length;
                      $scope.geometry = data.geometry;
                      $scope.config.xLabel = "Path length: " + $filter("length")(data.length, true);
 
                      if ($scope.length && $scope.geometry) {
                         elevationService.getElevation($scope.geometry, $scope.length).then(function (elevation) {
                            // Keep a handle on it as we will generally build a collection after the first build
                            $scope.elevation = {
                               style: elevationStyle,
                               data: elevation
                            };
                            // Show the range.
                            $scope.config.leftText = "Elevation Range: " +
                               $filter("length")(d3.min(elevation, function (d) { return d.z; }), true) + " to " +
                               $filter("length")(d3.max(elevation, function (d) { return d.z; }), true);
 
                            // If we got here we always want to wipe out existing paths.
                            $scope.paths = [$scope.elevation];
                         });
                      }
                   });
 
                   $scope.getInfoText = function () {
                      if (!$scope.infoText) {
                         $scope.infoText = infoLoading;
                         elevationService.getInfoText().then(function (html) {
                            $scope.infoText = html;
                         });
                      }
                   };
 
                   $scope.close = function () {
                      $scope.paths = $scope.geometry = $scope.length = null;
                   };
                }],
 
                link: function (scope, element) {
                   scope.graphClick = function (event) {
                      if (event.position) {
                         var point = event.position.points[0].point;
                         elevationService.panToPoint(point);
                         scope.point = point;
                      }
                   };
 
                   scope.graphLeave = function (event) {
                      scope.position = null;
                      crosshairService.remove();
                      $log.debug("Mouse left");
                      if (scope.mapListener) {
                         $log.info("offMapMove");
                         //featureSummaryService.offMapMove(scope.mapListener);
                      }
                   };
 
                   scope.graphEnter = function (event) {
                      $log.debug("Graph be entered");
                   };
 
                   scope.graphMove = function (event) {
                      var point;
 
                      scope.position = event.position;
 
                      if (scope.position) {
                         point = scope.position.point;
                         window.eve = event;
                         scope.position.markerLonlat = crosshairService.move(point);
                      }
 
                      $log.debug("Mouse moving...");
                   };
 
                   scope.$watch("geometry", processGeometry);
 
                   function processGeometry() {
                      if (scope.line) {
                         scope.line = elevationService.pathHide(scope.line);
                      }
                      if (scope.geometry) {
                         scope.line = elevationService.pathShow(scope.geometry);
                      } 
                   }
                }
             };
          }])
 
       .directive('marsPanTo', ['$rootScope', 'mapService', function ($rootScope, mapService) {
          var DEFAULTS = {
             eventName: "elevation.plot.data",
             options: {
                paddingTopLeft: [50, 50],
                paddingBottomRight: [50, 250]
             }
          };
          return {
             restrict: 'AE',
             scope: {
                eventName: "=",
                options: "="
             },
             link: function (scope) {
                angular.forEach(DEFAULTS, function (value, key) {
                   if (typeof scope[key] == "undefined") {
                      scope[key] = value;
                   }
                });
 
                $rootScope.$on(scope.eventName, function (event, data) {
                   var line = L.polyline(data.geometry);
                   var bounds = line.getBounds();
                   mapService.getMap().then(function (map) {
                      map.fitBounds(bounds, scope.options);
                   });
                });
             }
          };
       }])
 
       .provider("elevationService", function ConfigServiceProvider() {
          var pointCount = 500,
             elevationUrl = "service/path/elevation",
             waterTableUrl = "service/path/waterTable",
             artesianBasinKmlUrl = "service/artesianBasin/geometry/kml",
             intersectUrl = "service/artesianBasin/intersects",
             map,
             state = {
                isWaterTableShowing: false
             };
 
          this.setIntersectUrl = function (url) {
             intersectUrl = url;
          };
 
          this.setKmlUrl = function (url) {
             artesianBasinKmlUrl = url;
          };
 
          this.setElevationUrl = function (url) {
             elevationUrl = url;
          };
 
          this.setWaterTableUrl = function (url) {
             waterTableUrl = url;
          };
 
          this.$get = ['$log', 'httpData', '$q', 'mapService', 'flashService', function ($log, httpData, $q, mapService, flashService) {
 
             // We are safe doing this as it can't be triggered until the map is drawn anyway.
             mapService.getMap().then(function (olMap) { map = olMap; });
 
             var $elevation = {
                panToPoint: function (point) {
                   mapService.zoomTo(point.y, point.x);
                },
 
                getState: function () {
                   return state;
                },
 
                getElevation: function (geometry) {
                   flashService.add("Elevation service is down for maintenance.", 5000);
 
                   return $q.when({});
                },
 
                getInfoText: function () {
                   return httpData.get("map/elevation/elevationInfo.html", { cache: true }).then(function (response) {
                      return response.data;
                   });
                },
 
                pathShow: function (latlngs) {
                   var lineLayer = L.polyline(latlngs, { color: 'red', weight: 3, opacity: 0.8 }).addTo(map);
                   return lineLayer;
                },
 
                pathHide: function (lineLayer) {
                   map.removeLayer(lineLayer);
                   return null;
                }
             };
 
             return $elevation;
          }];
       });
 
 }
 

L.Control.ComingSoon = L.Control.extend({
    _active: false,
    _map: null,
    includes: L.Mixin.Events,
    options: {
        position: 'topleft',
        className: 'fa fa-italic fa-rotate-270',
        modal: false
    },
    onAdd: function (map) {
        this._map = map;
        this._container = L.DomUtil.create('div', 'leaflet-zoom-box-control leaflet-bar');
        this._container.title = "Elevation along a path (coming soon)";
        var link = L.DomUtil.create('a', this.options.className, this._container);
        link.href = "#";


        L.DomEvent
            .on(this._container, 'dblclick', L.DomEvent.stop)
            .on(this._container, 'click', L.DomEvent.stop)
            .on(this._container, 'click', function () {
                this._active = !this._active;

                var newZoom, zoom = map.getZoom();
                if (zoom <= map.getMinZoom()) {
                    return;
                }
                if (zoom < 10) {
                    newZoom = zoom - 1;
                } else if (zoom < 13) {
                    newZoom = zoom - 2;
                } else {
                    newZoom = zoom - 3;
                }
                map.setZoom(newZoom);
            }, this);
        return this._container;
    },
    activate: function () {
        L.DomUtil.addClass(this._container, 'active');
    },
    deactivate: function () {
        L.DomUtil.removeClass(this._container, 'active');
        this._active = false;
    }
});

L.control.comingSoon = function (options) {
    return new L.Control.ComingSoon(options);
};

