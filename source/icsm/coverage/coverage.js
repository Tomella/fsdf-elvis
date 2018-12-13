{
   angular.module("icsm.coverage", [])

   .directive("coverageToggle", ["coverageService", function (coverageService) {
      return {
         templateUrl: "icsm/coverage/trigger.html",
         restrict: "AE",
         link: function(scope) {
            scope.toggle = () => {
               coverageService.toggle()
            }
         }
      }
   }])

   .directive("icsmCoverageLayersSelector", ["$document", "coverageService", function ($document, coverageService) {
      return {
         templateUrl: "icsm/coverage/popup.html",
         scope: {
         },
         link: function (scope, element) {

            function keyupHandler(keyEvent) {
               if(keyEvent.which === 27) {
                  keyEvent.stopPropagation();
                  keyEvent.preventDefault();
                  scope.$apply(function() {
                      coverageService.hide();
                  });
               }
            }

            scope.state = coverageService.getState();

            scope.$watch("state.show", function(newValue) {
               if(newValue) {
                  $document.on('keyup', keyupHandler);
               } else {
                  $document.off('keyup', keyupHandler);
               }
               scope.$on('$destroy', function () {
                   $document.off('keyup', keyupHandler);
               });
            });

            scope.toggleVisibility = (layer) => {
               coverageService.toggleVisibility(layer);
            };
         }
      };
   }])
   .factory("coverageService", CoverageService)


CoverageService.$inject = ["configService", "mapService"];
function CoverageService(configService, mapService) {
   var state = {
      show: false
   };

   return {
      getState: function () {
         return state;
      },
      toggle: function() {
         state.show = !state.show;
         if(!state.layers) {
            configService.getConfig("map").then(config => {
               state.layers = config.layers.filter(element => {
                  return element.coverage;
               });

               mapService.getMap().then(map => {
                  state.map = map;
                  state.lookup = {};
                  state.layers.forEach(element => {
                     state.lookup[element.name] = element;
                     element.visible = map.hasLayer(element.layer);
                  });
               });
            });
         }
      },

      toggleVisibility: function(element) {
         element.visible = !element.visible;
         if(element.visible) {
            state.map.addLayer(element.layer);
         } else {
            element.layer.remove();
         }
      },

      hide: function() {
         state.show = false;
      }
   };
}
}