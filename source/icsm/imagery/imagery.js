{
   angular.module("icsm.imagery", [])

   .directive("launchImage", ["$rootScope", "configService", function($rootScope, configService) {
      return {
         templateUrl: "icsm/imagery/launch.html",
         restrict: "AE",
         link: function(scope) {
            let item = scope.item;
            scope.show = showButton(item);

            scope.preview = () => {
               configService.getConfig("imagery").then(config => {
                  let url = item.thumb_url;
                  console.log(url, item);
                  $rootScope.$broadcast("icsm-preview", {url, item});
               });
            };
         }
      }
   }]);

   function showButton(data) {
      return data.file_url && data.file_url.lastIndexOf(".zip") > 0; // Well it needs something in front of ".zip";
   }
}