{

   angular.module("icsm.clip", ['geo.draw'])

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

                  scope.clip = {
                     xMax: null,
                     xMin: null,
                     yMax: null,
                     yMin: null
                  };
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

                  scope.check = function () {
                     $timeout.cancel(timer);
                     timer = $timeout(function () {
                        $rootScope.$broadcast('icsm.clip.drawn', scope.clip);
                     }, 4000);
                  };

                  $rootScope.$on('icsm.clip.draw', function (event, data) {
                     if (data && data.message === "oversize") {
                        scope.oversize = true;
                        $timeout(() => {
                           delete scope.oversize;
                        }, 6000);
                     } else {
                        delete scope.oversize;
                     }
                     if(scope.viewing) {
                        scope.initiateDraw();
                     }
                  });

                  scope.initiateDraw = function () {
                     messageService.info("Click on the map and drag to define your area of interest.");
                     // It can only be triggered this way if the tab is open.
                     scope.viewing = true;
                     clipService.initiateDraw();
                  };

                  // We use viewing to determine if we care about a size greater than
                  $rootScope.$on("view.changed", function(event, data) {
                     scope.viewing = "download" === data;
                  });

                  $rootScope.$on("bounds.drawn", function(event, data) {
                     console.log("data", data);
                     drawComplete(clipService.setClip(data));
                  });

                  function drawComplete(data) {
                     let c = scope.clip;

                     c.xMax = +data.clip.xMax;
                     c.xMin = +data.clip.xMin;
                     c.yMax = +data.clip.yMax;
                     c.yMin = +data.clip.yMin;

                     $rootScope.$broadcast('icsm.clip.drawn', c);
                  }
               }
            };
         }])


      .factory("clipService", ['$q', '$rootScope', 'drawService', function ($q, $rootScope, drawService) {
         let options = {
            maxAreaDegrees: 4
         },
         service = {
            initiateDraw: function () {
               this.data = null;
               return drawService.drawRectangle({
                  retryOnOversize: true
               });
            },

            cancelDraw: function () {
               drawService.cancelDrawRectangle();
            },

            setClip: function(data) {
               return drawComplete(data);
            }
         };

         return service;

         function drawComplete(data) {
            let clip = {
               xMax: data.bounds.getEast().toFixed(5),
               xMin: data.bounds.getWest().toFixed(5),
               yMax: data.bounds.getNorth().toFixed(5),
               yMin: data.bounds.getSouth().toFixed(5)
            };
            let area = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);

            service.data = {
               clip: clip,
               area: area
            };

            return service.data;
         }
      }]);

}