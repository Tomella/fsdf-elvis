{
   angular.module('icsm.unreleased', [])
      .directive('icsmUnreleased', ['$rootScope', function ($rootScope) {
         return {
            templateUrl: "icsm/results/unreleased.html",
            scope: {
               types: "="
            },
            link: function (scope) {
               console.log("Unrelease me!");
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


      .directive('icsmProjectAbstract', ['listService', function (listService) {
         return {
            templateUrl: "icsm/results/abstractbutton.html",
            scope: {
               project: "="
            },
            link: function (scope) {
               scope.item = {

               }

               scope.show = listService.hasMetadata(scope.item);

               scope.toggle = function () {
                  scope.item.showAbstract = !scope.item.showAbstract;
                  if (scope.item.showAbstract) {
                     load();
                  }
               };

               function load() {
                  if (!scope.fetched) {
                     scope.fetched = true;
                     listService.getMetadata(scope.item).then(data => {
                        scope.item.metadata = data;
                     });
                  }
               }
            }
         };
      }])

      .filter("captured", function () {
         return captured;
      })

      .filter("reverseDate", function () {
         return formatDate;
      });

   function captured(twoDates) {
      if (!twoDates) {
         return twoDates;
      }

      let dates = twoDates.split(" - ");
      if (dates.length !== 2) {
         return twoDates;
      }

      return formatDate(dates[0]) + " - " + formatDate(dates[1]);
   }

   function formatDate(data) {
      if (data.length !== 8) {
         return data;
      }
      return data.substr(0, 4) + "/" + data.substr(4, 2) + "/" + data.substr(6, 2);
   }


   function toNumberArray(numbs) {
      if (angular.isArray(numbs) || !numbs) {
         return numbs;
      }
      return numbs.split(/,\s*/g).map(function (numb) {
         return +numb;
      });
   }
}