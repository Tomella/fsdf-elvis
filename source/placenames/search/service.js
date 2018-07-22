/**
 * This is the all of australia specific implementation of the search service.
 */
{
   angular.module("placenames.search.service", [])

      .factory('searchService', SearchService);

   SearchService.$inject = ['$http', '$rootScope', '$timeout', 'placenamesConfigService', 'mapService'];
}

function SearchService($http, $rootScope, $timeout, placenamesConfigService, mapService) {
   let data = {
      searched: null // Search results
   };

   let mapListeners = [];

   let results;
   let marker;

   let service = {

      onMapUpdate(listener) {
         mapListeners.push(listener);
      },

      offMapUpdate(listener) {
         delete mapListeners[listener];
      },

      get data() {
         return data;
      },

      get summary() {
         return summary;
      },

      filtered() {
         return placenamesConfigService.getConfig().then(({queryTemplate}) => {
            return mapService.getMap().then(map => {
               let template = queryTemplate;

               let bounds = map.getBounds();
               let center = map.getCenter();
               let q = typeof data.filter === "object" ? data.filter.name : data.filter;
               if (q && q.indexOf(" ") !== -1) {
                  q = '"' + q + '"';
               }
               q = "*" + (q?q:"");

               let yMin = Math.max(bounds.getSouth(), -90);
               let xMin = Math.max(bounds.getWest(), -180);
               let yMax = Math.min(bounds.getNorth(), 90);
               let xMax = Math.min(bounds.getEast(), 180);

               let x = center.lng;
               let y = center.lat;

               let params = {xMin, xMax, yMin, yMax, q, x, y};
               Object.keys(params).forEach(key => {
                  template = template.replace(new RegExp("\{" + key + "\}", "g"), params[key])
               });
               console.log(template)
               return $http({
                  url: template,
                  method: "GET",
                  cache: true
               }).then(response => {
                  return response.data;
               });
            });
         });
      },

      goto(what) {
         return mapService.getMap().then(map => {
            map.panTo(what.location.split(" ").reverse().map(str => +str));
            return this.hide();
         });
      },

      show(what) {
         return this.hide().then(map => {
            // split lng/lat string seperated by space, reverse to lat/lng, cooerce to numbers
            marker = L.marker(what.location.split(" ").map(num => +num).reverse(), {
               icon: L.icon({
                  iconUrl: 'icsm/resources/img/marker-icon-red.png',
                  iconSize: [25,41],
                  iconAnchor: [13, 41]
               })});
            marker.addTo(map);
            return map;
         });
      },

      hide() {
         return mapService.getMap().then(map => {
            if (marker) {
               marker.remove();
            }
            return map;
         });
      }
   };

   mapService.getMap().then(map => {
      let timeout;
      let facets = {
         facet: true,
         "facet.field": "feature"
      };

      map.on('resize moveend viewreset', update);

      function update() {
         $rootScope.$broadcast('pn.search.start');
         $timeout.cancel(timeout);
         if (!data.searched) {
            timeout = $timeout(function () {
               service.filtered();
            }, 20);
            mapListeners.forEach(listener => {
               listener();
            });
         } else {
            $rootScope.$broadcast('pn.search.complete', data.searched.data);
         }
      }
   });
   return service;
}
