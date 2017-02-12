/*!
 * Copyright 2016 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {
   'use strict';

   angular.module("placenames.search", ['placenames.facets', 'placenames.featuretypes', 'placenames.authorities'])

      .directive('pnClear', ['pnSearchService', function (pnSearchService) {
         return {
            link: function(scope, element) {
               pnSearchService.onMapUpdate(listening);
               function listening() {
                  if(element.is(":focus")) {
                     var e = $.Event("keydown");
                     e.which = 27; // # Some key code value
                     element.trigger(e);
                     element.blur();
                  }
               }
            }
         };
      }])

      .directive('pnOptions', ['pnSearchService', function (pnSearchService) {
         return {
            link: function (scope) {
               scope.leave = function () {
                  pnSearchService.hide();
               };

               scope.enter = function () {
                  pnSearchService.show(scope.match.model);
               };

               scope.$destroy = function () {
                  pnSearchService.hide();
               };
            }
         };
      }])

      .directive("pnSearch", ['$timeout', 'pnFacetsService', 'pnSearchService', function ($timeout, pnFacetsService, pnSearchService) {
         return {
            templateUrl: 'placenames/search/search.html',
            restrict: 'AE',
            link: function (scope) {
               scope.state = pnSearchService.data;
               scope.status = {classOpen:false};

               scope.$watch("state.searched", function(newVal, oldVal) {
                  if(!newVal && oldVal) {
                     pnSearchService.filtered();
                  }
               });

               pnSearchService.filtered();
               scope.update = function () {
                  pnSearchService.filtered();
               };

               scope.loadOnEmpty = function () {
                  if (!scope.state.filter) {
                     pnSearchService.filtered();
                  }
               };

               scope.search = function search(item) {
                  pnSearchService.search(item);
               };

               scope.select = function (item) {
                  scope.search(item);
               };

               scope.deselect = function (facet) {
                  facet.selected = false;
                  pnSearchService.filtered();
               };

               scope.loadDocs = function () {
                  return pnSearchService.filtered().then(fetched => {
                     return fetched.response.docs;
                  });
               };

               scope.$watch("status.classOpen", function(load) {
                  if(load && !scope.classifications) {
                     scope.classifications = true;
                     pnFacetsService.getClassifications().then(classifications => {
                        scope.state.classifications = classifications;
                     });
                  }
               });

               scope.$watch("status.open", function(load) {
                  if(load && !scope.featureCodes) {
                     scope.featureCodes = true;
                     pnFacetsService.getFeatureCodes().then(featureCodes => {
                        scope.state.featureCodes = featureCodes;
                     });
                  }
               });

               scope.$watch("status.authOpen", function(load) {
                  if(load && !scope.authorities) {
                     scope.authorities = true;
                     pnFacetsService.getAuthorities().then(authorities => {
                        scope.state.authorities = authorities;
                     });
                  }
               });
            }
         };
      }])

      .filter('pnDocName', [function () {
         return function (docs) {
            return docs ? docs.map(doc => doc.name + " (" + doc.recordId + ")") : [];
         };
      }])

      .filter('pnSomeSelected', [function () {
         return function (facets) {
            return facets ? Object.keys(facets).some(key => facets[key].selected) : false;
         };
      }])

      .filter('pnUnselectedFacets', [function () {
         return function (facets) {
            return !facets ? [] : facets.filter(facet => !facet.selected);
         };
      }])

      .filter('pnSelectedFacets', [function () {
         return function (facets) {
            return !facets ? [] : facets.filter(facet => facet.selected);
         };
      }])

      .filter('pnClean', [function () {
         return function (str) {
            return str.replace(/\s?[, ]\s?/g, " ");
         };
      }])

      .filter('pnTooltip', [function () {
         return function (model) {
            var buffer = "<div style='text-align:left'>";
            if(model.variant) {
               let variants = model.variant.split("|");
               variants.forEach((name, index) => {
                  buffer += index?"":"Also known as";
                  buffer += (index && index < variants.length - 1?",":"") + " ";
                  if(index && index === variants.length - 1) {
                     buffer += "or ";
                  }
                  buffer += name;
               });
               buffer += "<br/>";
            }
            buffer += "Lat " + model.location.split(" ").reverse().join("&deg; Lng ") + "&deg;<br/>Classification: " +
                     model.classification + "</div>";

            return buffer;
         };
      }])

      .factory('pnSearchService', SearchService);

   SearchService.$inject = ['$http', '$rootScope', '$timeout', 'configService', 'mapService'];
   function SearchService($http, $rootScope, $timeout, configService, mapService) {
      var data = {
         searched: null, // Search results
         featureCodes: [],
         classifications: [],
         authorities: []
      };
      var mapListeners =[];

      var results;
      var marker;

      var service = {
         onMapUpdate(listener) {
            mapListeners.push(listener);
         },

         offMapUpdate(listener) {
            delete mapListeners[listener];
         },

         get data() {
            return data;
         },

         filtered() {
            return filtered().then(response => {
               data.filtered = response;
               return response;
            });
         },

         request(params) {
            return request(params);
         },

         search(item) {
            if(item) {
               data.persist.item = item;
            }
            this.searched();
         },

         persist(params, response) {
            data.persist = {
               params,
               data: response
            };
         },

         searched() {
            data.searched = data.persist;
            this.hide();
         },

         show(what) {
            this.hide().then(map => {
               // split lng/lat string seperated by space, reverse to lat/lng, cooerce to numbers
               var location = what.location.split(" ").reverse().map(str => +str);
               marker = L.popup()
                     .setLatLng(location)
                     .setContent(what.name + "<br/>Lat/Lng: " +
                           location[0] + "&deg;" +
                           location[1] + "&deg;")
                     .openOn(map);
            });
         },

         hide(what) {
            return mapService.getMap().then(map => {
               if (marker) {
                  map.removeLayer(marker);
               }
               return map;
            });
         }
      };

      mapService.getMap().then(map => {
         var timeout;
         var facets = {
            facet: true,
            "facet.field": "featureCode"
         };

         map.on('resize moveend viewreset', function () {
            $timeout.cancel(timeout);
            if(!data.searched) {
               timeout = $timeout(function () {
                  service.filtered();
               }, 200);
               mapListeners.forEach(listener => {
                  listener();
               });
            }
         });
      });

      function filtered() {
         return createParams().then(params => {
            return run(params).then(data => {
               service.persist(params, data);
               return data;
            });
         });
      }

      function createParams() {
         return mapService.getMap().then(map => {
            var types = data.featureCodes;
            var features = types.filter(type => type.selected);
            var classes = data.classifications.filter(item => item.selected);
            var params = baseParameters();
            var filterIsObject = typeof data.filter === "object";
            var q = filterIsObject ? data.filter.name : data.filter;

            params.fq = getBounds(map);
            params.sort = getSort(map);
            params.q = q ? '"' + q.toLowerCase() + '"' : "*:*";

            var qs = [];
            features.forEach(feature => {
                qs.push("featureCode:" + feature.code);
            });
            classes.forEach(clazz => {
               qs.push('classification:"' + clazz.name + '"');
            });

            data.authorities.filter(auth => auth.selected).forEach(auth => {
               qs.push('authority:' + auth.code);
            });

            if(qs.length) {
               params.q += ' AND (' + qs.join(" ") + ')';
            }

            return params;
         });
      }

      function run(params) {
         return request(params).then(data => {
            var code;
            data.facetCounts = {};
            $rootScope.$broadcast("pn.facets.changed", data.facet_counts.facet_fields);
            return data;
         });
      }

      function request(params) {
         return $http({
            url: "/select",
            method: "GET",
            params,
            cache: true
         }).then(response => {
            return response.data;
         });
      }

      function getSort(map) {
         var bounds = map.getBounds();
         var dx = (bounds.getEast() - bounds.getWest())/2;
         var dy = (bounds.getNorth() - bounds.getSouth())/2;
         return "geodist(ll," +
            (bounds.getSouth() + dy) +
            "," +
            (bounds.getWest() + dx)+
            ") asc";
      }

      function getBounds(map) {
         var bounds = map.getBounds();
         return "location:[" +
            Math.max(bounds.getSouth(), -90) + "," +
            Math.max(bounds.getWest(), -180) + " TO " +
            Math.min(bounds.getNorth(), 90) + "," +
            Math.min(bounds.getEast(), 180) + "]";
      }

      function baseParameters() {
         return {
            facet: true,
            "facet.field": ["featureCode", "classification", "authority"],
            rows: 15,
            wt: "json"
         };
      }

      function baseFacetParameters() {
         var params = baseParameters();
         params.rows = 0;
      }

      return service;
   }

})(angular);
