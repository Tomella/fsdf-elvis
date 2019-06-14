/**
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

'use strict';

{
   angular.module("placenames.search", ['placenames.search.service', 'placenames.templates']).directive('placenamesOnEnter', function () {
      return function (scope, element, attrs) {
         element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
               scope.$apply(function () {
                  scope.$eval(attrs.placenamesOnEnter);
               });

               event.preventDefault();
            }
         });
      };
   }).directive('placenamesOptions', ['searchService', function (searchService) {
      return {
         link: function link(scope) {
            scope.leave = function () {
               searchService.hide();
            };

            scope.enter = function () {
               searchService.show(scope.match.model);
            };

            scope.$destroy = function () {
               searchService.hide();
            };
         }
      };
   }]).directive("placenamesQuickSearch", ['$document', '$rootScope', '$timeout', 'searchService', function ($document, $rootScope, $timeout, searchService) {
      return {
         templateUrl: 'placenames/search/quicksearch.html',
         restrict: 'AE',
         link: function link(scope) {
            scope.state = searchService.data;

            $document.on('keyup', function keyupHandler(keyEvent) {
               if (keyEvent.which === 27) {
                  keyEvent.stopPropagation();
                  keyEvent.preventDefault();
                  scope.$apply(function () {
                     scope.showFilters = false;
                  });
               }
            });

            scope.loadDocs = function () {
               return searchService.filtered().then(function (fetched) {
                  return fetched.response.docs;
               });
            };

            scope.search = function search(item) {
               scope.showFilters = false;
               searchService.goto(item).then(function () {
                  scope.state.filter = "";
                  $rootScope.$broadcast("search.button.fired", item);
               });
            };
         }
      };
   }]).filter('placenamesTooltip', [function () {
      return function (model) {
         var buffer = "<div style='text-align:left'>";
         if (model.variant) {
            var variants = model.variant.split("|");
            variants.forEach(function (name, index) {
               buffer += index ? "" : "Also known as";
               buffer += (index && index < variants.length - 1 ? "," : "") + " ";
               if (index && index === variants.length - 1) {
                  buffer += "or ";
               }
               buffer += name;
            });
            buffer += "<br/>";
         }
         buffer += "Lat " + model.location.split(" ").reverse().join("&deg; Lng ") + "&deg;<br/>Feature type: " + model.feature + "</div>";

         return buffer;
      };
   }]);;
}
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * This is the all of australia specific implementation of the search service.
 */
{
   angular.module("placenames.search.service", []).factory('searchService', SearchService);

   SearchService.$inject = ['$http', '$rootScope', '$timeout', 'placenamesConfigService', 'mapService'];
}

function SearchService($http, $rootScope, $timeout, placenamesConfigService, mapService) {
   var data = {
      searched: null // Search results
   };

   var mapListeners = [];

   var results = void 0;
   var marker = void 0;

   var service = {
      onMapUpdate: function onMapUpdate(listener) {
         mapListeners.push(listener);
      },
      offMapUpdate: function offMapUpdate(listener) {
         delete mapListeners[listener];
      },


      get data() {
         return data;
      },

      get summary() {
         return summary;
      },

      filtered: function filtered() {
         return placenamesConfigService.getConfig().then(function (_ref) {
            var queryTemplate = _ref.queryTemplate;

            return mapService.getMap().then(function (map) {
               var template = queryTemplate;

               var bounds = map.getBounds();
               var center = map.getCenter();
               var q = _typeof(data.filter) === "object" ? data.filter.name : data.filter;
               if (q && q.indexOf(" ") !== -1) {
                  q = '"' + q + '"';
               }
               q = "*" + (q ? q : "");

               var yMin = Math.max(bounds.getSouth(), -90);
               var xMin = Math.max(bounds.getWest(), -180);
               var yMax = Math.min(bounds.getNorth(), 90);
               var xMax = Math.min(bounds.getEast(), 180);

               var x = center.lng;
               var y = center.lat;

               var params = { xMin: xMin, xMax: xMax, yMin: yMin, yMax: yMax, q: q, x: x, y: y };
               Object.keys(params).forEach(function (key) {
                  template = template.replace(new RegExp("\{" + key + "\}", "g"), params[key]);
               });
               console.log(template);
               return $http({
                  url: template,
                  method: "GET",
                  cache: true
               }).then(function (response) {
                  return response.data;
               });
            });
         });
      },
      goto: function goto(what) {
         var _this = this;

         var increment = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3;
         var zoom = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 11;

         return mapService.getMap().then(function (map) {
            var current = map.getZoom();
            map.setView(what.location.split(" ").reverse().map(function (str) {
               return +str;
            }), current + increment, { maxZoom: zoom });
            return _this.hide();
         });
      },
      show: function show(what) {
         return this.hide().then(function (map) {
            // split lng/lat string seperated by space, reverse to lat/lng, cooerce to numbers
            marker = L.marker(what.location.split(" ").map(function (num) {
               return +num;
            }).reverse(), {
               icon: L.icon({
                  iconUrl: 'icsm/resources/img/marker-icon-red.png',
                  iconSize: [25, 41],
                  iconAnchor: [13, 41]
               }) });
            marker.addTo(map);
            return map;
         });
      },
      hide: function hide() {
         return mapService.getMap().then(function (map) {
            if (marker) {
               marker.remove();
            }
            return map;
         });
      }
   };

   mapService.getMap().then(function (map) {
      var timeout = void 0;
      var facets = {
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
            mapListeners.forEach(function (listener) {
               listener();
            });
         } else {
            $rootScope.$broadcast('pn.search.complete', data.searched.data);
         }
      }
   });
   return service;
}
"use strict";

{
   angular.module("placenames.config", []).provider("placenamesConfigService", function () {
      var baseUrl = "placenames.json";

      this.location = function (where) {
         baseUrl = where;
      };

      this.$get = ['$http', function configServiceFactory($http) {
         return {
            getConfig: function getConfig() {
               return $http.get(baseUrl, { cache: true }).then(function (response) {
                  return response.data;
               });
            }
         };
      }];
   });
}
"use strict";

{
   angular.module("placenames.summary", []).directive("placenamesSummary", ['$document', "$rootScope", "mapService", function ($document, $rootScope, mapService) {
      return {
         restrict: "AE",
         templateUrl: "placenames/summary/summary.html",
         link: function link(scope) {
            $rootScope.$on("search.button.fired", function (event, item) {
               console.log("item", item);
               scope.remove();

               scope.item = item;
               scope.latLng = item.location.split(" ").map(function (num) {
                  return +num;
               }).reverse();
               mapService.getMap().then(function (map) {
                  scope.marker = L.marker(scope.latLng, {
                     icon: L.icon({
                        iconUrl: 'icsm/resources/img/marker-icon-red.png',
                        iconSize: [25, 41],
                        iconAnchor: [13, 41]
                     }) }).addTo(map);
               });
            });

            scope.remove = function () {
               if (scope.marker) scope.marker.remove();
               scope.item = scope.marker = null;
            };

            scope.close = function () {
               scope.remove();
            };

            $document.on('keydown', function keyupHandler(keyEvent) {
               if (keyEvent.which === 27) {
                  scope.$apply(function () {
                     scope.remove();
                  });
               }
            });
         }
      };
   }]);
}
"use strict";

function getBounds(bounds, restrictTo) {
   var fq = void 0;

   if (restrictTo) {

      var left = Math.max(bounds.getWest(), -180, restrictTo.getWest());
      var right = Math.min(bounds.getEast(), 180, restrictTo.getEast());
      var top = Math.min(bounds.getNorth(), 90, restrictTo.getNorth());
      var bottom = Math.max(bounds.getSouth(), -90, restrictTo.getSouth());

      fq = "location:[" + (bottom > top ? top : bottom) + "," + (left > right ? right : left) + " TO " + top + "," + right + "]";
   } else {
      fq = "location:[" + Math.max(bounds.getSouth(), -90) + "," + Math.max(bounds.getWest(), -180) + " TO " + Math.min(bounds.getNorth(), 90) + "," + Math.min(bounds.getEast(), 180) + "]";
   }
   return fq;
}
angular.module("placenames.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("placenames/search/quicksearch.html","<div class=\"search-text\" style=\"color:black; width: 26em\" title=\"Start typing in the filter field. Up to twenty matches will be shown as you type with those nearest your map center at the top of the list. The results are restricted to your map\'s field of view so zooming the map in or out will change the number of results.\">\r\n   <div class=\"input-group input-group-sm\" style=\"width:100%\">\r\n      <input class=\"hide\"></input>\r\n      <input type=\"text\" ng-model=\"state.filter\" placeholder=\"Match by feature name...\" placenames-on-enter=\"search($item, $model, $label)\"\r\n         ng-model-options=\"{ debounce: 300}\" typeahead-on-select=\"search($item, $model, $label)\" typeahead-focus-first=\"false\"\r\n         typeahead-template-url=\"placenames/search/typeahead.html\" class=\"form-control\" typeahead-min-length=\"1\"\r\n         uib-typeahead=\"doc as doc.name for doc in loadDocs(state.filter)\" typeahead-loading=\"loadingLocations\" typeahead-no-results=\"noResults\"\r\n         placenames-clear>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/search/typeahead.html","<a placenames-options ng-mouseenter=\"enter()\" ng-mouseleave=\"leave()\"  tooltip-append-to-body=\"true\"\r\n               tooltip-placement=\"bottom\" uib-tooltip-html=\"match.model | placenamesTooltip\">\r\n   <span ng-bind-html=\"match.model.name | uibTypeaheadHighlight:query\"></span>\r\n   (<span ng-bind-html=\"match.model.authority + \' - \' + match.model.feature\"></span>)\r\n</a>");
$templateCache.put("placenames/summary/summary.html","<div class=\"placenames\" ng-show=\"item\">\r\n   <button class=\"undecorated placenames-unstick\" ng-click=\"close()\" style=\"float:right\">X</button>\r\n   <div style=\"float:left\">\r\n      <div class=\"container-fluid\">\r\n         <div class=\"row\">\r\n            <div class=\"col-md-12 pn-header placenames-title\">\r\n               {{item.name}}\r\n            </div>\r\n         </div>\r\n      </div>\r\n      <div class=\"container-fluid\">\r\n         <div class=\"row\">\r\n            <div class=\"col-md-4\" title=\"An authority can be a state department or other statutory authority\">Authority</div>\r\n            <div class=\"col-md-8\">{{item.authority}}</div>\r\n         </div>\r\n         <div class=\"row\">\r\n            <div class=\"col-md-4\" title=\"Features belong to a category and categories belong to a group\">Feature Type</div>\r\n            <div class=\"col-md-8\">{{item.feature}}</div>\r\n         </div>\r\n         <div class=\"row\" title=\"Features belong to a category and categories belong to a group\">\r\n            <div class=\"col-md-4\">Category</div>\r\n            <div class=\"col-md-8\">{{item.category}}</div>\r\n         </div>\r\n         <div class=\"row\" title=\"Features belong to a category and categories belong to a group\">\r\n            <div class=\"col-md-4\">Group</div>\r\n            <div class=\"col-md-8\">{{item.group}}</div>\r\n         </div>\r\n         <div class=\"row\">\r\n            <div class=\"col-md-4\">Lat / Lng</div>\r\n            <div class=\"col-md-8\">\r\n               <span class=\"pn-numeric\">\r\n                  {{latLng[0]}}&deg; / {{latLng[1]}}&deg;\r\n               </span>\r\n            </div>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>");}]);