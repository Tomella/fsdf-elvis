{

   angular.module("icsm.plot", [])

      .directive("icsmPlot", ['$log', function ($log) {
         return {
            restrict: "AE",
            scope: {
               line: "="
            },
            link: function (scope, element, attrs, ctrl) {
               scope.$watch("line", function (newValue, oldValue) {
                  $log.info(newValue);
               });
            }
         };
      }]);

}