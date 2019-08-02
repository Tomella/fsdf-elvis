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
                  let url = generateUrl(item);
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

   function generateUrl(data) {
      let fileName = data.file_name;
      let imagePart = "thumbnails/" + fileName.replace(".zip", ".png");

      return data.file_url.replace(fileName, imagePart);
   }
}