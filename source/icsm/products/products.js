{
   angular.module("icsm.products", ["icsm.product"])
      .provider('productsConfigService', [function () {
         var location = "icsm/resources/config/download.json";

         this.setLocation = function (newLocation) {
            location = newLocation;
         };

         this.$get = ["$http", function factory($http) {
            return new DownloadConfig(location, $http);
         }];
      }]);

   class DownloadConfig {

      constructor(url, $http) {
         this.$http = $http;
         this.location = url;
      }

      child(name) {
         return this.config.then(data => data[name]);
      }

      get initiateServiceTemplates() {
         return child('initiateServiceTemplates');
      }

      get processingTemplates() {
         return this.child('processing');
      }

      get outputFormat() {
         return this.child('outFormat');
      }

      get defaultOutputFormat() {
         return this.outputFormat.then(list => list.find(item => item.default));
      }

      get defaultOutputCoordinateSystem() {
         return this.outputCoordinateSystem.then(systems => systems.find(item => item.default));
      }

      get outputCoordinateSystem() {
         return this.child('outCoordSys');
      }

      get datasets() {
         return this.child('datasets');
      }

      get config() {
         return this.$http.get(this.location, { cache: true }).then(response => response.data);
      }
   }
}