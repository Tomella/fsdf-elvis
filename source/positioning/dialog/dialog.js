{
   angular.module("positioning.dialog",
         ["positioning.filename", "positioning.mandatory", "positioning.output", "positioning.progress", "positioning.email"])

      .directive("acceptEpsg4283", [
         function () {
            return {
               scope: {
                  state: "="
               },
               templateUrl: "positioning/dialog/isepsg4283.html"
            };
         }
      ])

      .directive("transformationTarget", ['configService',
         function (configService) {
            return {
               scope: {
                  state: "="
               },
               templateUrl: "positioning/dialog/transformationtarget.html",
               link: function(scope) {
                  configService.getConfig("transformation").then(data => {
                     scope.transformations = data;
                  });
               }
            };
         }
      ])

      .directive("uploadDialog", [
         function () {
            return {
               scope: {
                  state: "=",
                  settings: "="
               },
               templateUrl: "positioning/dialog/dialog.html",
               link: function (scope) {
                  scope.cancel = () => {
                     scope.state = new State();
                  }
               }
            };
         }
      ])

      .directive("uploadSubmit", ['configService', 'edDownloadService', 'messageService', function (configService, edDownloadService, messageService) {
         return {
            templateUrl: "download/downloader/submit.html",
            scope: {
               item: "=",
               processing: "="
            },
            link: function (scope, element, attrs) {
               scope.submit = function () {
                  let processing = scope.processing;

                  edDownloadService.setEmail(processing.email);

                  // Assemble data
                  edDownloadService.submit(scope.item.processing.template,
                     {
                        id: scope.item.primaryId,
                        yMin: processing.clip.yMin,
                        yMax: processing.clip.yMax,
                        xMin: processing.clip.xMin,
                        xMax: processing.clip.xMax,
                        outFormat: processing.outFormat.code,
                        outCoordSys: processing.outCoordSys.code,
                        filename: processing.filename ? processing.filename : "",
                        email: processing.email
                     });
                  messageService.success("Submitted your job. An email will be delivered on completion.");
               };
            }
         };
      }]);
}