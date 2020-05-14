{
   angular.module("icsm.parameters", [])

   .factory("parametersService", ["$location", function($location){
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
               metadata: this.search.metadata,
               polygon: this.polygon
            } : null;
         }

         get bounds() {
            let s = this.search;
            return this.hasValidBbox() ?
               L.latLngBounds([s.miny, s.minx], [s.maxy, s.maxx]) : null;
         }

         get polygon() {
            return  "POLYGON(("
               + this.search.minx + " " + this.search.miny + ","
               + this.search.minx + " " + this.search.maxy + ","
               + this.search.maxx + " " + this.search.maxy + ","
               + this.search.maxx + " " + this.search.miny + ","
               + this.search.minx + " " + this.search.miny + "))";
         }

         get data() {  // Just a wrapper around bounds same as draw does.
            return this.hasValidBbox() ?
               {bounds: this.bounds, metadata: this.metadata, polygon: this.polygon } : null;
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

      return service;
   }]);
}