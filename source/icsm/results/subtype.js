{
   angular.module("icsm.subtype", ['bw.paging'])

   .directive("subtype", ['$rootScope', function($rootScope) {
      return {
         templateUrl: "icsm/results/subtype.html",
         scope: {
            items: "=",
            mappings: "="
         },
         link: function(scope) {
            let timer = null;

            scope.paging = {
               page: 1,
               pageSize: 20
            };

            scope.$on("filter.changed", () => {
               scope.setPage(1, 20);
            });

            scope.setPage = function(page, pagesize) {
               let matchedItems = scope.items.filter(item => item.matched);
               scope.data = matchedItems.slice(pagesize * (page - 1), page * pagesize);
            };

            scope.setPage(1, 20);

            scope.show = function (data) {
               var bbox = toNumberArray(data.bbox);
               $rootScope.$broadcast('icsm.bbox.draw', bbox);
            };

            scope.hide = function (data) {
               $rootScope.$broadcast('icsm.bbox.draw', null);
            };
         }
      };
   }]);



   function toNumberArray(numbs) {
      if (angular.isArray(numbs) || !numbs) {
         return numbs;
      }
      return numbs.split(/,\s*/g).map(function (numb) {
         return +numb;
      });
   }
}