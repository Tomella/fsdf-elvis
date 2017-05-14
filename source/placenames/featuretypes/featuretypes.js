(function (angular) {
   'use strict';

   angular.module("placenames.featuretypes", ['placenames.pills'])

      .directive('pnFeaturetypes', [function () {
         return {
				restrict: 'EA',
            templateUrl: "placenames/featuretypes/featuretypes.html",
            bindToController: {
               types: "=",
               update: "&"
            },
            controller: function () {
               console.log(this.types);
            },
            controllerAs: "vm"
         };
      }])

      .directive('pnFeaturetypesPills', [function () {
         return {
				restrict: 'EA',
            template: '<pn-pills pills="pfp.features" class="pn-feature-pills" update="pfp.update()"></pn-pills>',
            bindToController: {
               features: "=",
               update: "&"
            },
            controller: function () {

            },
            controllerAs: "pfp"
         };
      }])

      .filter("pnHasName", function() {
         return function(list) {
            return (list ? list : []).filter(item => !!item.name);
         }
      });

})(angular);
