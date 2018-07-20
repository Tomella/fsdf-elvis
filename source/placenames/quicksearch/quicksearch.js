{
   angular.module("placenames.quicksearch",['placenames.templates', 'placenames.search.service', 'placenames.search', 'placenames.pill'])

   .directive('placenamesQuicksearch', [function() {
      return {
         link: function() {
         },
         templateUrl: "placenames/quicksearch/quicksearch.html"
      };
   }])

   .directive('placenamesFilteredSummary', ["searchService", function(searchService) {
      return {
         scope: {
            state: "="
         },
         templateUrl: "placenames/quicksearch/filteredsummary.html",
         link: function(scope) {
            scope.summary = searchService.summary;
         }
      };
   }])

   .filter("quicksummary", [function() {
      return function(items, key) {
         return items.map(item => (item[key] + "(" + item.count + ")")).join(", ");
      };
   }]);

}