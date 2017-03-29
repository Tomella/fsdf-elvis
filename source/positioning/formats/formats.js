{
   angular.module("positioning.format", [])

   .directive("inputFormat", function() {
      return {
         scope: {
            list: "="
         },
         templateUrl: "positioning/formats/formats.html"
      };
   });

}