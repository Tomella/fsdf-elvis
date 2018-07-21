{
   angular.module("placenames.search", ['placenames.search.service', 'placenames.templates', 'placenames.tree'])

      .directive('placenamesOnEnter', function () {
         return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
               if (event.which === 13) {
                  scope.$apply(function () {
                     scope.$eval(attrs.placenamesOnEnter);
                  });

                  event.preventDefault();
               }
            });
         };
      })

      .directive('placenamesOptions', ['searchService', function (searchService) {
         return {
            link: function (scope) {
               scope.leave = function () {
                  searchService.hide();
               };

               scope.enter = function () {
                  searchService.show(scope.match.model);
               };

               scope.$destroy = function () {
                  searchService.hide();
               };
            }
         };
      }])

      .directive("placenamesQuickSearch", ['$document', '$rootScope', '$timeout', 'searchService',
         function ($document, $rootScope, $timeout, searchService) {
            return {
               templateUrl: 'placenames/search/quicksearch.html',
               restrict: 'AE',
               link: function (scope) {
                  scope.state = searchService.data;

                  $document.on('keyup', function keyupHandler(keyEvent) {
                     if (keyEvent.which === 27) {
                        keyEvent.stopPropagation();
                        keyEvent.preventDefault();
                        scope.$apply(function () {
                           scope.showFilters = false;
                        });
                     }
                  });

                  scope.loadDocs = function () {
                     return searchService.filtered().then(fetched => {
                        return fetched.response.docs;
                     });
                  };

                  scope.search = function search(item) {
                     scope.showFilters = false;
                     searchService.goto(item);
                     $timeout(() => {
                        $rootScope.$broadcast("search.button.fired", item);
                     }, 10);
                  };
               }
            };
         }
      ]);
}