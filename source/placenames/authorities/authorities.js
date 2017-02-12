(function (angular) {
   'use strict';

   angular.module("placenames.authorities", [])

      .directive('pnAuthorities', [function () {
         return {
				restrict: 'EA',
            templateUrl: "placenames/authorities/authorities.html",
            bindToController: {
               authorities: "=",
               update: "&"
            },
            controller: function () {
               console.log(this.authorities);
            },
            controllerAs: "pa"
         };
      }])

      .directive('pnAuthoritiesPills', [function () {
         return {
				restrict: 'EA',
            template: '<span class="pn-authorities-pills" pn-pills pills="pap.authorities" class="pn-feature-pills" update="pap.update()"></span>',
            bindToController: {
               authorities: "=",
               update: "&"
            },
            controller: function () {
            },
            controllerAs: "pap"
         };
      }]);

})(angular);
