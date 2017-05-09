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
         let type = data.extension;

         formData.append('type', type);
         if (type === "csv") {
            formData.append('file', data.file);
            formData.append("latDegreesColumn", data.latDegreesCol);
            formData.append("lngDegreesColumn", data.lngDegreesCol);

            if (data.dmsType === "dms") {
               formData.append("latMinutesColumn", data.latMinutesCol);
               formData.append("lngMinutesColumn", data.lngMinutesCol);

               formData.append("latSecondsColumn", data.latSecondsCol);
               formData.append("lngSecondsColumn", data.lngSecondsCol);
            }
            if (data.elevationCol) {
               formData.append("elevationColumn", data.elevationCol);
            }
         } else {
            Object.keys(data.file).forEach(key => formData.append(key, data.file[key]));
         }
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

      .directive("progressBarCsv", ["messageService", "submitService", function (messageService, submitService) {
         return {
            scope: {
               state: "="
            },
            templateUrl: "positioning/progress/progresscsv.html",
            link: function (scope) {
               scope.submit = function () {
                  submitService.post(scope.state);
                  messageService.success("Posted CSV file for processing. You will receive an email on completion.");
                  scope.state = new State();
               };

               scope.cancel = function () {
                  messageService.success("Cleared selected CSV file");
                  scope.state = new State();
               };
            }
         };
      }])

      .directive("progressBarShapefile", ["messageService", "submitService", function (messageService, submitService) {
         return {
            scope: {
               state: "="
            },
            templateUrl: "positioning/progress/progresshapefile.html",
            link: function (scope) {
               scope.submit = function () {
                  submitService.post(scope.state);
                  messageService.success("Posted shapefiles for processing. You will receive an email on completion.");
                  scope.state = new State();
               };

               scope.cancel = function () {
                  messageService.success("Cleared selected shapefiles");
                  scope.state = new State();
               };
            }
         };
      }])

      .filter("sumFiles", [function() {
         return function(files) {
            if(!files) {
               return 0;
            }

            return Object.keys(files).reduce((acc, key) => acc + files[key].size, 0)
         };
      }])

      .service("submitService", SubmitService)
}