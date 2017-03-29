{

   class CsvService {
      constructor(configService) {
         configService.getConfig().then(config => {
            this.options = Object.assign(
               {
                  blockSize: 1024 * 8 // Really big bit
               },
               config
            );
         });
      }

      getColumns(file) {
         let blob = file.slice(0, this.options.blockSize);
         let reader = new FileReader();
         reader.readAsText(blob);
         return new Promise((resolve, reject) => {
            reader.onloadend = (evt) => {
               console.log(evt.target["readyState"] + "\n\n" + evt.target["result"]);

               if (evt.target["readyState"] === FileReader.prototype.DONE) { // DONE == 2
                  let buffer = evt.target["result"];
                  if (buffer.length) {
                     // We don't read the whole file, just the start.
                     let lines = buffer.substr(0, buffer.lastIndexOf("\n"));
                     resolve(CSVToArray(lines));
                  } else {
                     reject(buffer);
                  }
               }
            };
         });
      }
   }
   CsvService.$invoke = ["configService"];

   angular.module("positioning.csv", [])

      .directive("csvFile", ["csvService", function (csvService) {
         return {
            templateUrl: "positioning/csv/csv.html",
            scope: {
               state: "=",
               settings: "="
            },
            link: function(scope) {
               csvService.getColumns(scope.state.file).then(csv => {
                  console.log
                  scope.columns = csv[0];
               });
            }
         };
      }])

      .service("csvService", CsvService);
}