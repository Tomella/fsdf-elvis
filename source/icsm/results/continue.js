{

   angular.module("elvis.results.continue", [])

      .directive('icsmSearchContinue', ['configService', 'continueService', function (configService, continueService) {
         return {
            templateUrl: 'icsm/results/continue.html',
            controller: 'listCtrl',
            controllerAs: 'ctrl',
            link: function (scope, element) {
               configService.getConfig("downloadLimit").then(size => {
                  scope.limit = size;
               });
               scope.data = continueService.data;
            }
         };
      }])

      .factory('continueService', ['listService', function (listService) {
         var service = {};
         service.data = listService.data;
         return service;
      }])

      .filter("someSelected", function () {
         return function (products) {
            return products && products.some(item => item.selected);
         };
      })

      .filter("countSelected", function () {
         return function (products) {
            return products?products.filter(item => item.selected).length: '';
         };
      });
}