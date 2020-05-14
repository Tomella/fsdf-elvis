{
   angular.module("placenames.config", [])

      .provider("placenamesConfigService", function () {
         var baseUrl = "placenames.json";

         this.location = function (where) {
            baseUrl = where;
         };

         this.$get = ['$http', function configServiceFactory($http) {
            return {
               getConfig: function () {
                  return $http.get(baseUrl, { cache: true }).then(response => response.data);
               }
            };
         }];
      });
}