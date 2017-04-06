{
   angular.module("positioning.output", [])

   .directive("outputFormat", function() {
      return {
         link: {
            state:"="
         },
         templateUrl: 'positioning/output/output.html'
      };
   });
}