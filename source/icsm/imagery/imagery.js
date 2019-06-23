{
   angular.module("icsm.imagery", [])

   .directive("launchImage", ["$rootScope", function($rootScope) {
      return {
         templateUrl: "icsm/imagery/launch.html",
         restrict: "AE",
         link: function(scope) {
            scope.preview = () => {
               let item = scope.item;
               let url = generateUrl(item);
               console.log(url, item.file_url);
               $rootScope.$broadcast("icsm-preview", {url, item});
            };
         }
      }
   }]);

   function generateUrl(data) {
      let index = data.file_url.lastIndexOf(".zip");
      return data.file_url.substr(0, index) + ".jpg";
   }
}