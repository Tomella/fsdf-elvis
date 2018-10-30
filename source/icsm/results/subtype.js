{
   angular.module("icsm.subtype", ['bw.paging'])

      .directive("subtype", ['$rootScope', function ($rootScope) {
         return {
            templateUrl: "icsm/results/subtype.html",
            scope: {
               items: "=",
               mappings: "="
            },
            link: function (scope) {
               let timer = null;

               scope.paging = {
                  page: 1,
                  pageSize: 20
               };

               scope.$on("filter.changed", () => {
                  console.log("Filter changed - Subtype")
                  scope.setPage(1, 20);
               });

               scope.setPage = function (page, pagesize) {
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
      }])

      .filter("hasProducts", function () {
         return (items) => items.some(item => item.product);
      })


      .filter("hasTransformables", function () {
         return (items) => items.some(item => item.transformable);
      })

      .filter("productsSummary", function () {
         return (items) => {
            let count = items.filter(item => item.product).length;
            let response = " including ";
            switch(count) {
               case 1: response += "1 product";
                  break
               default: response += count + " products"
            }
            return response;
         };
      })

      .filter("productsCount", function () {
         return (items) => items ? items.filter(item => item.product).length : 0;
      })

      .filter("transformablesCount", function () {
         return (items) => items ? items.filter(item => item.transformable).length : 0;
      });



   function toNumberArray(numbs) {
      if (angular.isArray(numbs) || !numbs) {
         return numbs;
      }
      return numbs.split(/,\s*/g).map(function (numb) {
         return +numb;
      });
   }
}