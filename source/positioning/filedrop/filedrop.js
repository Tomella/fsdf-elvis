{
   angular.module("positioning.filedrop", [])

      .directive("fileDrop", ["messageService", function (messageService) {
         return {
            templateUrl: "positioning/filedrop/filedrop.html",
            scope: {
               state: "="
            },
            link: function (scope, element) {
               let fileDrop = new FileDrop(element[0], file => {
                  scope.$apply(() => {
                     let name = file.name;
                     let ext = name.substr(name.lastIndexOf(".") + 1);
                     ext = ext ? ext.toLowerCase() : "";
                     switch (ext) {
                        case "csv":
                           handleCsv(file);
                           break;
                        // case "dbf":
                        // case "prj":
                        // case "shp":
                        case "shx":
                           handleShapefile(ext, file);
                           break;
                        default:
                           messageService.warn("Ignoring \"" + file.name + "\" as it is not a supported format.");
                     }
                  });
               });

               function handleCsv(file) {
                  if (scope.state.file) {
                     messageService.error("If you are sure you want to replace the current worklow \"Cancel\" the previous workflow first.");
                  } else {
                     scope.state.file = file
                     scope.state.extension = "csv";
                     scope.state.outputName = file.name.substr(0, file.name.lastIndexOf("."));
                  }
               }

               function handleShapefile(ext, file) {
                  let name = file.name.substr(0, file.name.lastIndexOf("."));

                  if (!scope.state.file) {
                     scope.state.outputName = name;
                     scope.state.extension = "shp";
                     scope.state.file = {
                        dbf: false,
                        shp: false,
                        shx: false,
                        prj: false
                     };
                  }

                  if (scope.state.file && (scope.state.ext === "csv" || scope.full || scope.state.outputName !== name)) {
                     messageService.error("If you are sure you want to replace the current worklow \"Cancel\" the previous workflow first.");
                  } else {
                     let container = scope.state.file;
                     container[ext] = file;
                  }
               }
            }
         }
      }]);
}