{
   class SubmitService {
      constructor($http, configService) {
         this.$http = $http;
         configService.getConfig("submit").then(data => {
            this.config = data;
         });
      }

      post(data) {

         let formData = new FormData();
         formData.append('file', data.file);
         formData.append("email", data.email);
         formData.append("outFormat", data.outFormat);
         formData.append("outputName", data.outputName + ".zip");
         formData.append("email", data.email);

         return this.$http({
            url: this.config.template,
            method: 'POST',
            data: formData,
            //assign content-type as undefined, the browser
            //will assign the correct boundary for us
            headers: { 'Content-Type': undefined },
            //prevents serializing payload.  don't do it.
            transformRequest: angular.identity
         });

         function decorateFileData() {
            if (true) {
            }
         }
      }
   }
   SubmitService.$inject = ["$http", "configService"];

   angular.module("positioning.progress", [])

      .directive("progressBar", ["submitService", function (submitService) {
         return {
            scope: {
               state: "="
            },
            templateUrl: "positioning/progress/progress.html",
            link: function (scope) {
               scope.submit = function () {
                  submitService.post(scope.state);
               }
            }
         };
      }])

      .service("submitService", SubmitService);
}