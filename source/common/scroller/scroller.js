(function (angular) {
   'use strict';

   angular.module("common.scroll", [])

      .directive("commonScrollLoad", ['$timeout', function ($timeout) {
         return {
            scope: {
               more: "&",
               allFetched: "="
            },
            link: function (scope, element, attrs) {
               var fetching;
               element.on("scroll", function (event) {
                  var target = element[0],
                     dim = target.getBoundingClientRect(),
                     totalHeight = dim.height,
                     scrollHeight = element.scrollTop(),
                     scrollWindow = element.height(),
                     scrollBottom;
                  if (fetching) return;

                  fetching = true;
                  $timeout(bouncer, 250);

                  function bouncer() {
                     fetching = false;
                     console.log("bouncer1");
                  }
               });
            }
         };
      }]);

})(angular);
