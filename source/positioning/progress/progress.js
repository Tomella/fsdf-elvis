{
   class SubmitService {
      constructor($http, configService) {
         this.$http = $http;
         configService.getConfig("submit").then(data => {
            this.config = data;
         });
      }

      post(data) {
         let type = data.extension;
         let fileName = encodeURIComponent(data.file.name);


         // First we get a token
         return this.$http({
            url: this.config.tokenUrl
         }).then(response => {
            // Then we upload the file
            return this.$http({
               url: this.config.template.replace("${token}", response.data.serviceResponse.token),
               method: 'POST',
               //assign content-type as undefined, the browser
               //will assign the correct boundary for us
               //prevents serializing payload.  don't do it.
               headers: {
                  "Content-Type": "application/octet-stream",
                  "Content-Disposition": "attachment; filename=\"" + fileName + "\""
               },
               data: data.file,
               transformRequest: angular.identity
            }).catch(response => {
               let formData = {
                  input_filename: fileName,
                  type: type,
                  transformation: data.transformation,
                  email: data.email,
               };

               if (type === "csv") {
                  if (data.dmsType === "dms") {
                     formData.lat_deg_fld = data.latDegreesCol;
                     formData.lng_deg_fld = data.lngDegreesCol;

                     formData.lat_min_fld = data.latMinutesCol;
                     formData.lng_min_fld = data.lngMinutesCol;

                     formData.lat_sec_fld = data.latSecondsCol;
                     formData.lng_sec_fld = data.lngSecondsCol;
                     if (data.elevationCol) {
                        formData.z_fld = data.elevationCol;
                     }
                  } else {
                     formData.lat_dd_fld = data.latDegreesCol;
                     formData.lng_dd_fld = data.lngDegreesCol;
                  }
               }
               return this.$http({
                  url: this.config.transformUrl,
                  method: 'POST',
                  //assign content-type as undefined, the browser
                  //will assign the correct boundary for us
                  //prevents serializing payload.  don't do it.
                  headers: {
                     "Content-Type": "application/json"
                  },
                  json: formData,
                  transformRequest: angular.identity
               })
            });
         });
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
                  submitService.post(scope.state).catch(error => {
                     messageService.error("Posted CSV file for processing but the request failed. Please try again later.");
                  });
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

      .filter("sumFiles", [function () {
         return function (files) {
            if (!files) {
               return 0;
            }

            return Object.keys(files).reduce((acc, key) => acc + files[key].size, 0)
         };
      }])

      .service("submitService", SubmitService)
}