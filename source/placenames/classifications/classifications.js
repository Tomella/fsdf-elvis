(function (angular) {
   'use strict';

   angular.module("placenames.classifications", [])

      .directive('pnClassifications', [function () {
         return {
				restrict: 'EA',
            templateUrl: "placenames/classifications/classifications.html",
            bindToController: {
               classifications: "=",
               update: "&"
            },
            controller: function () {
               console.log(this.classifications);
            },
            controllerAs: "pc"
         };
      }])

      .directive('pnClassificationsPills', [function () {
         return {
				restrict: 'EA',
            template: '<span pn-pills class="pn-classifications-pills" pills="pcp.classifications" class="pn-feature-pills" update="pcp.update()"></span>',
            bindToController: {
               classifications: "=",
               update: "&"
            },
            controller: function () {
            },
            controllerAs: "pcp"
         };
      }]);

})(angular);
