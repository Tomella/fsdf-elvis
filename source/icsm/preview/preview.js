{
   angular.module("icsm.preview", [])

   .directive("previewImage", ["$rootScope", function($rootScope) {
      return {
         templateUrl: "icsm/preview/preview.html",
         restrict: "AE",
         link: function(scope) {
            /* Test. If you uncomment out this it will show up on page load.
            scope.image = {
               url: "icsm/resources/img/fbimage.jpg",
               item: {
                  file_name: "Test_Image.zip"
               }
            };
             */
            scope.clear = () => {
               scope.previewData = null;
            };

            $rootScope.$on("icsm-preview", function(event, data) {
               scope.previewData = data;
            });
         }
      }
   }])
   .factory("previewService", [function(){
      // We read the parameters once only. Then the app can decide what to do with them.
      class Service  {
         constructor(search) {
            this.search = search;
         }

         ignoreSizeLimit() {
            return !!this.search.metadata;
         }

         get bbox() {
            return this.hasValidBbox() ? {
               minx: +this.search.minx,
               maxx: +this.search.maxx,
               miny: +this.search.miny,
               maxy: +this.search.maxy
            } : null;
         }

         get clip() {
            return this.hasValidBbox() ? {
               xMin: +this.search.minx,
               xMax: +this.search.maxx,
               yMin: +this.search.miny,
               yMax: +this.search.maxy,
               metadata: this.search.metadata
            } : null;
         }

         get bounds() {
            let s = this.search;
            return this.hasValidBbox() ?
               L.latLngBounds([s.miny, s.minx], [s.maxy, s.maxx]) : null;
         }

         get data() {  // Just a wrapper around bounds same as draw does.
            return this.hasValidBbox() ?
               {bounds: this.bounds, metadata: this.metadata } : null;
         }

         hasValidBbox() {
            let parameters = this.search;
            return !(isNaN(parameters.minx) || isNaN(parameters.maxx) || isNaN(parameters.miny) || isNaN(parameters.maxy))
         }

         get metadata() {
            return this.search.metadata;
         }

         clear() {
            this.search = {};
         }
      };

      let service = new Service($location.search());

window.larry = service;
      return service;
   }]);
}