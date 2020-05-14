{
   angular.module("icsm.clip", ['geo.draw', 'explorer.clip.modal'])

      .directive('icsmInfoBbox', function () {
         return {
            restrict: 'AE',
            templateUrl: 'icsm/clip/infobbox.html'
         };
      })

      .directive("icsmClip", ['$rootScope', '$timeout', 'clipService', 'messageService', 'mapService',
         function ($rootScope, $timeout, clipService, messageService, mapService) {
            return {
               templateUrl: "icsm/clip/clip.html",
               scope: {
                  bounds: "=",
                  trigger: "=",
                  drawn: "&"
               },
               link: function (scope, element) {
                  let timer;

                  scope.clip = clipService.data.clip;

                  scope.typing = false;

                  if (typeof scope.showBounds === "undefined") {
                     scope.showBounds = false;
                  }
                  mapService.getMap().then(function (map) {
                     scope.$watch("bounds", function (bounds) {
                        if (bounds && scope.trigger) {
                           $timeout(function () {
                              scope.initiateDraw();
                           });
                        } else if (!bounds) {
                           clipService.cancelDraw();
                        }
                     });
                  });

                  $rootScope.$on('icsm.clip.draw', function (event, data) {
                     if (data && data.message === "oversize") {
                        scope.oversize = true;
                        $timeout(() => {
                           delete scope.oversize;
                        }, 6000);
                     } else {
                        delete scope.oversize;
                     }
                  });
                  // Hide the manual drawing
                  $rootScope.$on('icsm.clip.drawn', () => scope.typing = false);

                  scope.initiateDraw = function () {
                     messageService.info("Click on the map and drag to define your area of interest.");
                     clipService.initiateDraw();
                  };

                  scope.initiatePolygon = function () {
                     messageService.info("Click on map for each vertex. Click on the first vertex to close the polygon.", 6);
                     clipService.initiatePolygon();
                  };
               }
            };
         }])

      .directive('icsmManualClip', ["$rootScope", "clipService", function ($rootScope) {
         return {
            restrict: 'AE',
            templateUrl: 'icsm/clip/manual.html',
            scope:{},
            link: function (scope) {
               // yMax, yMin, xMax,xMin

               $rootScope.$on('icsm.polygon.drawn', (event, c) => setClip(c));
               $rootScope.$on('icsm.clip.drawn', (event, c) => setClip(c));

               function setClip(c) {
                  scope.xMin = c.xMin;
                  scope.yMin = c.yMin;
                  scope.xMax = c.xMax;
                  scope.yMax = c.yMax;
               }

               scope.allowSearch = () => !isNan(scope.xMin) && !isNan(scope.xMax) && !isNan(scope.yMin) && !isNan(scope.yMax) &&
                  (+scope.xMin) !== (+scope.xMax) && (+scope.yMin) !== (+scope.yMax);

               scope.search = function() {
                  // Normalise coordinates
                  let min = scope.xMin;
                  let max = scope.xMax;
                  scope.xMin = Math.min(min, max);
                  scope.xMax = Math.max(min, max);

                  min = scope.yMin;
                  max = scope.yMax;
                  scope.yMin = Math.min(min, max);
                  scope.yMax = Math.max(min, max);

                  $rootScope.$broadcast("bounds.drawn", {
                     bounds: L.latLngBounds(L.latLng(+scope.yMin, +scope.xMin), L.latLng(+scope.yMax, +scope.xMax))
                  });
               };
            }
         };
      }])


      .factory("clipService", ['$rootScope', 'drawService', 'parametersService',
               function ($rootScope, drawService, parametersService) {
         let options = {
            maxAreaDegrees: 4
         },
            service = {
               data: {
                  clip: {}
               },
               initiateDraw: function () {
                  this.cancelDraw();
                  $rootScope.$broadcast("clip.initiate.draw", { started: true });
                  let clip = this.data.clip;
                  delete clip.xMin;
                  delete clip.xMax;
                  delete clip.yMin;
                  delete clip.yMax;
                  delete clip.area;
                  delete clip.type;
                  delete clip.polygon;
                  return drawService.drawRectangle({
                     retryOnOversize: false
                  });
               },

               initiatePolygon: function () {
                  this.cancelDraw();
                  $rootScope.$broadcast("clip.initiate.draw", { started: true });
                  let clip = this.data.clip;
                  delete clip.xMin;
                  delete clip.xMax;
                  delete clip.yMin;
                  delete clip.yMax;
                  delete clip.area;
                  delete clip.type;
                  delete clip.polygon;
                  return drawService.drawPolygon({
                     retryOnOversize: false
                  });
               },

               cancelDraw: function () {
                  drawService.cancelDraw();
               },

               setClip: function (data) {
                  return drawComplete(data);
               }
            };

            $rootScope.$on("bounds.drawn", function (event, data) {
               broadcaster(data);  // Let people know it is drawn
            });

            $rootScope.$on("polygon.drawn", (event, data) => {
               $rootScope.$broadcast('icsm.poly.draw', data[0]);  // Let people know it is drawn
               let clip = service.data.clip;
               let polyData = data[0];
               clip.type = "polygon";
               clip.xMax = Math.max(...polyData.map(element => element.lng));
               clip.xMin = Math.min(...polyData.map(element => element.lng));
               clip.yMax = Math.max(...polyData.map(element => element.lat));
               clip.yMin = Math.min(...polyData.map(element => element.lat));
               clip.polygon = "POLYGON((" +
                        [...polyData, polyData[0]].map(item => item.lng.toFixed(5) + " " + item.lat.toFixed(5)).join(",") + "))";

               $rootScope.$broadcast('icsm.polygon.drawn', clip);
            });

         let data = parametersService.data;
         if(data) {
            broadcaster(data, true);
            service.data.clip.type = "bbox";
         }

         return service;

         function broadcaster(data, zoom) {
            console.log("data", data);
            service.setClip(data);
            let c = service.data.clip;

            $rootScope.$broadcast('icsm.bounds.draw', [
               c.xMin,
               c.yMin,
               c.xMax,
               c.yMax,
               !!zoom
            ]);// Draw it

            $rootScope.$broadcast('icsm.clip.drawn', c);  // Let people know it is drawn
         }

         function drawComplete(data) {
            let clip = service.data.clip;
            clip.xMax = data.bounds.getEast().toFixed(5);
            clip.xMin = data.bounds.getWest().toFixed(5);
            clip.yMax = data.bounds.getNorth().toFixed(5);
            clip.yMin = data.bounds.getSouth().toFixed(5);
            clip.type = "bbox";
            clip.polygon = "POLYGON(("
                  + clip.xMin + " " + clip.yMin + ","
                  + clip.xMin + " " + clip.yMax + ","
                  + clip.xMax + " " + clip.yMax + ","
                  + clip.xMax + " " + clip.yMin + ","
                  + clip.xMin + " " + clip.yMin + "))";

            service.data.area = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);

            return service.data;
         }
      }]);

}