{
   angular.module("positioning.filename", [])
   .directive("filename", [function() {
      return {
         scope: {
            state: "="
         },
         templateUrl: "positioning/filename/filename.html"
      }
   }]);
}