{
   angular.module("positioning.filedrop", [])

      .directive("fileDrop", [function (scope) {
         return {
            templateUrl: "positioning/filedrop/filedrop.html",
            scope: {
               state: "="
            },
            link: function (scope, element) {
               let fileDrop = new FileDrop(element[0], file => {
                  scope.$apply(() => {
                     if (!scope.state.file) {
                        let name = file.name;
                        let ext = name.substr(name.lastIndexOf(".") + 1);
                        ext = ext ? ext.toLowerCase() : "";
                        scope.state.file = file
                        scope.state.extension = ext;
                     }
                  });
               })
            }
         }
      }]);
}