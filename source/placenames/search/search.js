/*!
 * Copyright 2016 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {
   'use strict';

   angular.module("placenames.search", [])

      .directive('placenamesClear', ['placenamesSearchService', function (placenamesSearchService) {
         return {
            link: function(scope, element) {
               placenamesSearchService.onMapUpdate(listening);
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

      .directive('placenamesOptions', ['placenamesSearchService', function (placenamesSearchService) {
         return {
            link: function (scope) {
               scope.leave = function () {
                  placenamesSearchService.hide();
               };

               scope.enter = function () {
                  placenamesSearchService.show(scope.match.model);
               };

               scope.$destroy = function () {
                  placenamesSearchService.hide();
               };
            }
         };
      }])

      .directive("placenamesSearch", ['$timeout', 'placenamesSearchService', function ($timeout, placenamesSearchService) {
         return {
            templateUrl: 'placenames/search/search.html',
            restrict: 'AE',
            link: function (scope) {
               scope.state = placenamesSearchService.data;

               scope.$watch("state.searched", function(newVal, oldVal) {
                  if(!newVal && oldVal) {
                     placenamesSearchService.filtered();
                  }
               });

               placenamesSearchService.filtered();
               scope.update = function () {
                  placenamesSearchService.filtered();
               };

               scope.loadOnEmpty = function () {
                  if (!scope.state.filter) {
                     placenamesSearchService.filtered();
                  }
               };

               scope.search = function search(item) {
                  placenamesSearchService.search(item);
               };

               scope.select = function (item) {
                  scope.search(item);
               };

               scope.deselect = function (facet) {
                  facet.selected = false;
                  placenamesSearchService.filtered();
               };

               scope.loadDocs = function () {
                  return placenamesSearchService.filtered().then(fetched => {
                     return fetched.response.docs;
                  });
               };
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
            return !facets ? [] : Object.keys(facets).filter(key => !facets[key].selected).map(key => facets[key]);
         };
      }])

      .filter('pnSelectedFacets', [function () {
         return function (facets) {
            return !facets ? [] : Object.keys(facets).filter(key => facets[key].selected).map(key => {
               var facet = facets[key];
               facet.code = key;
               return facet;
            });
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

      .factory('placenamesSearchService', SearchService);

   SearchService.$inject = ['$http', '$rootScope', '$timeout', 'configService', 'mapService'];
   function SearchService($http, $rootScope, $timeout, configService, mapService) {
      var data = {
         searched: false, // Search results
         featureCodes: []
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
            data.searched = true;
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
                     .openOn(map);;
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

      configService.getConfig("classifications").then(config => {
         data.classifications = {};

         Object.keys(config).forEach(key => {
            data.classifications[key] = {
               name: config[key]
            };
         });
      });

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
            var types = data.classifications;
            var features = Object.keys(types).filter(key => types[key].selected);
            var params = baseParameters();
            var filterIsObject = typeof data.filter === "object";
            var q = filterIsObject ? data.filter.name : data.filter;

            params.fq = getBounds(map);
            params.sort = getSort(map);
            params.q = q ? '"' + q.toLowerCase() + '"' : "*:*";
            if (features.length) {
               if (features.length === 1) {
                  params.q += " AND featureCode:" + features[0];
               } else {
                  params.q += " AND (featureCode:(" +
                     features.map(code => "featureCode:" + code).join(" ") +
                     "))";
               }
            }
            return params;
         });
      }

      function run(params) {
         return request(params).then(data => {
            var code;
            data.facetCounts = {};
            // Transform the facets into something useful
            data.facet_counts.facet_fields.featureCode.forEach((value, index) => {
               if (index % 2 === 0) {
                  code = value;
               } else {
                  data.facetCounts[code] = {
                     count: value,
                     code
                  };
               }
            });
            decorateFeatureNames(data.facetCounts);
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

      function decorateFeatureNames(features) {
         Object.keys(features).forEach(key => {
            features[key].parent = data.classifications[key];
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
            "facet.field": "featureCode",
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
