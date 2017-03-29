{
   class FileController {
      constructor() {}
   }

   angular.module("positioning.file", ["positioning.format", "positioning.csv", "positioning.dialog"])

   .directive("file", function() {
      return {
         templateUrl: "positioning/file/file.html"
      };
   })

   .controller("fileController", FileController);

}