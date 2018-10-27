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
               }
            };
         }])

      .directive('icsmManualClip', ["$rootScope", "clipService", function ($rootScope, clipService) {
         return {
            restrict: 'AE',
            templateUrl: 'icsm/clip/manual.html',
            scope:{},
            link: function (scope) {
               // yMax, yMin, xMax,xMin

               $rootScope.$on('icsm.clip.drawn', function(event, c) {
                  scope.xMin = c.xMin;
                  scope.yMin = c.yMin;
                  scope.xMax = c.xMax;
                  scope.yMax = c.yMax;
               });

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


      .factory("clipService", ['$q', '$rootScope', 'drawService', function ($q, $rootScope, drawService) {
         let options = {
            maxAreaDegrees: 4
         },
            service = {
               data: {
                  clip: {}
               },
               initiateDraw: function () {
                  $rootScope.$broadcast("clip.initiate.draw", { started: true });
                  let clip = this.data.clip;
                  delete clip.xMin;
                  delete clip.xMax;
                  delete clip.yMin;
                  delete clip.yMax;
                  delete clip.area;
                  return drawService.drawRectangle({
                     retryOnOversize: false
                  });
               },

               cancelDraw: function () {
                  drawService.cancelDrawRectangle();
               },

               setClip: function (data) {
                  return drawComplete(data);
               }
            };

         $rootScope.$on("bounds.drawn", function (event, data) {
            console.log("data", data);
            service.setClip(data);
            let c = service.data.clip;

            $rootScope.$broadcast('icsm.clip.drawn', c);  // Let people know it is drawn
            $rootScope.$broadcast('icsm.bounds.draw', [
               c.xMin,
               c.yMin,
               c.xMax,
               c.yMax
            ]);// Draw it
         });

         return service;



         function drawComplete(data) {
            let clip = service.data.clip;
            clip.xMax = data.bounds.getEast().toFixed(5);
            clip.xMin = data.bounds.getWest().toFixed(5);
            clip.yMax = data.bounds.getNorth().toFixed(5);
            clip.yMin = data.bounds.getSouth().toFixed(5);

            service.data.area = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);

            return service.data;
         }
      }]);

}