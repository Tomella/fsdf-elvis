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
   angular.module("placenames.categories", []).directive("placenamesCategories", ['groupsService', "searchService", function (groupsService, searchService) {
      return {
         templateUrl: "placenames/categories/categories.html",
         link: function link(scope) {
            groupsService.getCategories().then(function (categories) {
               return scope.categories = categories;
            });
            scope.change = function () {
               searchService.filtered();
            };
         }
      };
   }]).directive("placenamesCategoryChildren", [function () {
      return {
         templateUrl: "placenames/categories/features.html",
         scope: {
            features: "="
         }
      };
   }]);
}
"use strict";

{
   angular.module("placenames.feature", []).directive("placenamesFeatures", ['groupsService', "searchService", function (groupsService, searchService) {
      return {
         templateUrl: "placenames/features/features.html",
         link: function link(scope) {
            groupsService.getFeatures().then(function (features) {
               return scope.features = features;
            });
            scope.change = function () {
               searchService.filtered();
            };
         }
      };
   }]);
}
"use strict";

{
   angular.module("placenames.tree", []).directive("placenamesTree", ["groupsService", "searchService", function (groupsService, searchService) {
      return {
         templateUrl: "placenames/filters/tree.html",
         restrict: "AE",
         link: function link(scope) {
            groupsService.getGroups().then(function (groups) {
               return scope.groups = groups;
            });

            scope.change = function (group) {
               searchService.filtered();
               if (group.selected) {
                  group.expanded = true;
               }
            };
         }
      };
   }]).filter("withTotals", function () {
      return function (list) {
         if (list) {
            return list.filter(function (item) {
               return item.total;
            });
         }
      };
   });
}
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   (function () {
      var Group = function () {
         function Group() {
            _classCallCheck(this, Group);

            this.label = "group";
            this.color = "#4286f4";
            this._selected = false;
         }

         _createClass(Group, [{
            key: "selections",
            value: function selections() {
               var response = [];
               if (this.selected) {
                  this.categories.forEach(function (category) {
                     response.push.apply(response, _toConsumableArray(category.selections()));
                  });
                  if (!response.length) {
                     return [this];
                  }
               }
               return response;
            }
         }, {
            key: "selected",
            get: function get() {
               return this._selected;
            },
            set: function set(val) {
               this._selected = val;
               if (!val && this.categories) {
                  this.categories.forEach(function (category) {
                     return category.selected = false;
                  });
               }
            }
         }, {
            key: "selectExpand",
            get: function get() {
               return this.selected;
            },
            set: function set(val) {
               this.selected = val;
               if (val) {
                  this.expanded = val;
               }
            }
         }]);

         return Group;
      }();

      var Category = function () {
         function Category() {
            _classCallCheck(this, Category);

            this.label = "category";
            this.color = "#21a470";
            this._selected = false;
         }

         _createClass(Category, [{
            key: "selections",
            value: function selections() {
               var response = [];
               if (this.selected) {
                  response = this.features.filter(function (feature) {
                     return feature._selected;
                  });

                  if (!response.length) {
                     return [this];
                  }
               }
               return response;
            }
         }, {
            key: "selected",
            get: function get() {
               return this._selected;
            },
            set: function set(val) {
               this._selected = val;
               if (val) {
                  this.parent.selected = true;
               } else if (this.features) {
                  this.features.forEach(function (feature) {
                     return feature.selected = false;
                  });
               }
            }
         }, {
            key: "selectExpand",
            get: function get() {
               return this.selected;
            },
            set: function set(val) {
               this.selected = val;
               if (val) {
                  this.expanded = val;
               }
            }
         }]);

         return Category;
      }();

      var Feature = function () {
         function Feature() {
            _classCallCheck(this, Feature);

            this.label = "feature";
            this.color = "#d68a39";
            this._selected = false;
         }

         _createClass(Feature, [{
            key: "selections",
            value: function selections() {
               if (this.selected) {
                  return [this];
               }
               return [];
            }
         }, {
            key: "selected",
            get: function get() {
               return this._selected;
            },
            set: function set(val) {
               this._selected = val;
               if (val) {
                  this.parent.selected = true;
               }
            }
         }]);

         return Feature;
      }();

      var createCategories = function createCategories(target) {
         target.categories = Object.keys(target.groups);
      };

      angular.module("placenames.groups", ["placenames.feature", "placenames.categories"]).directive("placenamesGroups", ['groupsService', "searchService", function (groupsService, searchService) {
         return {
            templateUrl: "placenames/groups/groups.html",
            link: function link(scope) {
               groupsService._loadGroups().then(function (data) {
                  scope.data = data;
               });

               scope.change = function () {
                  console.log("Update groups");
                  searchService.filtered();
               };
            }
         };
      }]).directive("placenamesGroupChildren", ['groupsService', function (groupsService) {
         return {
            templateUrl: "placenames/groups/category.html",
            scope: {
               category: "="
            }
         };
      }]).factory("groupsService", ["$http", "placenamesConfigService", function ($http, placenamesConfigService) {
         var service = {};
         service._loadGroups = function () {
            return service.getCounts().then(function (count) {
               return placenamesConfigService.getConfig().then(function (all) {
                  // Merge the groups
                  var config = all.groups;
                  service.config = config;

                  return $http.get(config.referenceDataLocation, { cache: true }).then(function (_ref) {
                     var data = _ref.data;

                     config.data = data;
                     config.categories = [];
                     config.features = [];
                     config.authorities = all.authorities;

                     config.authorities.forEach(function (authority) {
                        var total = count.authority[authority.code];
                        authority.total = total ? total : 0;
                     });

                     config.groups = Object.keys(data).filter(function (key) {
                        return !(key === 'name' || key === 'definition');
                     }).map(function (key) {
                        var _config$categories;

                        var group = new Group();

                        Object.assign(group, {
                           name: key,
                           total: count.group[key] ? count.group[key] : 0,
                           definition: data[key].definition,
                           categories: Object.keys(data[key]).filter(function (key) {
                              return !(key === 'name' || key === 'definition');
                           }).map(function (name) {
                              var response = new Category();
                              Object.assign(response, {
                                 name: name,
                                 total: count.category[name] ? count.category[name] : 0,
                                 definition: data[key][name].definition,
                                 parent: group,
                                 features: data[key][name].features.map(function (feature) {
                                    var container = new Feature();
                                    Object.assign(container, feature, {
                                       parent: response,
                                       total: count.feature[feature.name] ? count.feature[feature.name] : 0
                                    });
                                    return container;
                                 })
                              });
                              return response;
                           })
                        });

                        (_config$categories = config.categories).push.apply(_config$categories, _toConsumableArray(group.categories));
                        group.categories.forEach(function (category) {
                           var _config$features;

                           (_config$features = config.features).push.apply(_config$features, _toConsumableArray(category.features));
                        });
                        return group;
                     });
                     // After thought: Why bother with any that have zero counts? Filter them out now.
                     config.authorities = config.authorities.filter(function (authority) {
                        return authority.total;
                     });
                     config.groups = config.groups.filter(function (group) {
                        return group.total;
                     });
                     config.categories = config.categories.filter(function (category) {
                        return category.total;
                     });
                     config.features = config.features.filter(function (feature) {
                        return feature.total;
                     });
                     window.larry = config.groups;
                     return config;
                  });
               });
            });
         };

         service.getCategories = function () {
            return service._loadGroups().then(function () {
               return service.config.categories;
            });
         };

         service.getAll = function () {
            return service._loadGroups().then(function () {
               return service.config;
            });
         };

         service.getAuthorities = function () {
            return service._loadGroups().then(function () {
               return service.config.authorities;
            });
         };

         service.getGroups = function () {
            return service._loadGroups().then(function () {
               return service.config.groups;
            });
         };

         service.getFeatures = function () {
            return service._loadGroups().then(function () {
               return service.config.features;
            });
         };

         service.getCounts = function () {
            return placenamesConfigService.getConfig().then(function (_ref2) {
               var groups = _ref2.groups;

               return $http.get(groups.referenceDataCountsUrl).then(function (_ref3) {
                  var data = _ref3.data;

                  // There are now three object within counts group, category and feature
                  var counts = data.facet_counts.facet_fields;
                  var response = {
                     feature: {},
                     category: {},
                     group: {},
                     authority: {}
                  };
                  var lastElement = void 0;

                  ["feature", "category", "group", "authority"].forEach(function (key) {

                     counts[key].forEach(function (value, index) {
                        if (index % 2) {
                           response[key][lastElement] = value;
                        } else {
                           lastElement = value;
                        }
                     });
                  });
                  return response;
               });
            });
         };

         return service;
      }]);
   })();
}
"use strict";

{
   angular.module("placenames.summary", []).directive("placenamesSummary", ["$rootScope", "mapService", function ($rootScope, mapService) {
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
                  scope.marker = L.marker(scope.latLng).addTo(map);
               });
            });

            scope.remove = function () {
               if (scope.marker) scope.marker.remove();
               scope.item = scope.marker = null;
            };

            scope.close = function () {
               scope.remove();
            };
         }
      };
   }]);
}
'use strict';

{
   angular.module("placenames.search", ['placenames.search.service', 'placenames.templates', 'placenames.tree']).directive('placenamesOnEnter', function () {
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
               searchService.goto(item);
               $timeout(function () {
                  $rootScope.$broadcast("search.button.fired", item);
               }, 10);
            };
         }
      };
   }]);
}
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

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

         return mapService.getMap().then(function (map) {
            map.panTo(what.location.split(" ").reverse().map(function (str) {
               return +str;
            }));
            return _this.hide();
         });
      },
      show: function show(what) {
         return this.hide().then(function (map) {
            // split lng/lat string seperated by space, reverse to lat/lng, cooerce to numbers
            marker = L.marker(what.location.split(" ").map(function (num) {
               return +num;
            }).reverse());
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
angular.module("placenames.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("placenames/categories/categories.html","<div>\r\n   <div ng-repeat=\"category in categories | orderBy: \'name\'\" ng-attr-title=\"{{category.definition}}\">\r\n      <input type=\"checkbox\" ng-model=\"category.selected\" ng-change=\"change()\">\r\n      <span title=\"[Group: {{category.parent.name}}], {{category.definition}}\">\r\n         {{category.name}}\r\n         ({{(category.allCount | number) + (category.allCount || category.allCount == 0?\' of \':\'\')}}{{category.total}})\r\n      </span>\r\n      <button class=\"undecorated\" ng-click=\"category.showChildren = !category.showChildren\">\r\n         <i class=\"fa fa-lg\" ng-class=\"{\'fa-question-circle-o\':!category.showChildren, \'fa-minus-square-o\': category.showChildren}\"></i>\r\n      </button>\r\n      <div ng-show=\"category.showChildren\" style=\"padding-left: 8px; border-bottom: solid 1px lightgray\">\r\n         <div>[Group: {{category.parent.name}}]\r\n         <div ng-if=\"category.definition\">{{category.definition}}</div>\r\n         It includes the following feature types:\r\n         <placenames-category-children features=\"category.features\"></placenames-category-children>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/categories/features.html","<div>\n   <div ng-repeat=\"feature in features\" style=\"padding-left:10px\" title=\"{{feature.definition}}\">\n      - {{feature.name}} ({{feature.total}})\n   </div>\n</div>");
$templateCache.put("placenames/features/features.html","<div>\r\n      <div ng-repeat=\"feature in features | orderBy: \'name\'\" title=\"{{feature.definition}}\">\r\n         <input type=\"checkbox\" ng-model=\"feature.selected\" ng-change=\"change()\">\r\n         <span title=\"[Group/category: {{feature.parent.parent.name}}/{{feature.parent.name}}], {{feature.definition}}\">\r\n            {{feature.name}} ({{(feature.allCount | number) + (feature.allCount || feature.allCount == 0?\' of \':\'\')}}{{feature.total}})\r\n         </span>\r\n         <button class=\"undecorated\" ng-click=\"feature.showChildren = !feature.showChildren\">\r\n            <i class=\"fa fa-lg\" ng-class=\"{\'fa-question-circle-o\':!feature.showChildren, \'fa-minus-square-o\': feature.showChildren}\"></i>\r\n         </button>\r\n         <div ng-show=\"feature.showChildren\" style=\"padding-left: 8px; border-bottom: solid 1px lightgray\">\r\n            <div ng-if=\"feature.definition\">{{feature.definition}}</div>\r\n            [Group/Category: {{feature.parent.parent.name}}/{{feature.parent.name}}]\r\n         </div>\r\n      </div>\r\n   </div>");
$templateCache.put("placenames/filters/tree.html","<div style=\"max-height:300px; overflow-y:auto;padding-left:10px;\">\r\n   <div ng-repeat=\"group in groups | withTotals\">\r\n      <button class=\"undecorated\" ng-click=\"group.expanded = !group.expanded\" ng-style=\"{color:group.color}\">\r\n         <i class=\"fa\" ng-class=\"{\'fa-plus\':!group.expanded, \'fa-minus\':group.expanded}\"></i>\r\n      </button>\r\n      <input type=\"checkbox\" class=\"filters-check\" ng-model=\"group.selectExpand\" ng-change=\"change(group)\" ng-style=\"{color:group.color}\">\r\n      <span title=\"{{group.definition}}\">\r\n         {{group.name}} ({{(group.allCount | number) + (group.allCount || group.allCount == 0?\' of \':\'\')}}{{group.total | number}})\r\n      </span>\r\n      <div style=\"padding-left:10px\" ng-show=\"group.expanded\">\r\n         <div ng-repeat=\"category in group.categories | withTotals | orderBy: \'name\'\"  ng-attr-title=\"{{category.definition}}\">\r\n            <button class=\"undecorated\" ng-click=\"category.expanded = !category.expanded\" ng-style=\"{color:category.color}\">\r\n               <i class=\"fa\" ng-class=\"{\'fa-plus\':!category.expanded, \'fa-minus\':category.expanded}\"></i>\r\n            </button>\r\n            <input class=\"filters-check\" type=\"checkbox\" ng-model=\"category.selectExpand\" ng-change=\"change()\" ng-style=\"{color:category.color}\">\r\n            <span title=\"{{category.definition}}\">\r\n               {{category.name}}\r\n               ({{(category.allCount | number) + (category.allCount || category.allCount == 0?\' of \':\'\')}}{{category.total}})\r\n            </span>\r\n            <div ng-show=\"category.expanded\" style=\"padding-left:20px\">\r\n               <div ng-repeat=\"feature in category.features | withTotals | orderBy: \'name\'\"  ng-attr-title=\"{{feature.definition}}\">\r\n                  <i class=\"fa fa-hand-o-right\" aria-hidden=\"true\" ng-style=\"{color:feature.color}\"></i>\r\n                  <input class=\"filters-check\" type=\"checkbox\" ng-model=\"feature.selected\" ng-change=\"change()\" ng-style=\"{color:feature.color}\">\r\n                  <span>\r\n                     {{feature.name}}\r\n                     ({{(feature.allCount | number) + (feature.allCount || feature.allCount == 0?\' of \':\'\')}}{{feature.total}})\r\n                  </span>\r\n               </div>\r\n            </div>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/groups/category.html","\r\n<div style=\"padding-left:10px\">\r\n   - <span ng-attr-title=\"{{category.definition}}\">{{category.name}}</span>\r\n   <div ng-repeat=\"feature in category.features | orderBy:\'name\'\" style=\"padding-left:10px\">\r\n      - <span ng-attr-title=\"{{feature.definition}}\">{{feature.name}}</span>\r\n   </div>\r\n</div>\r\n");
$templateCache.put("placenames/groups/groups.html","<div>\r\n   <div ng-repeat=\"group in data.groups\">\r\n      <input type=\"checkbox\" ng-model=\"group.selected\" ng-change=\"change()\"><span title=\"{{group.definition}}\">\r\n         {{group.name}} ({{(group.allCount | number) + (group.allCount || group.allCount == 0?\' of \':\'\')}}{{group.total | number}})\r\n      <button class=\"undecorated\" ng-click=\"group.showChildren = !group.showChildren\">\r\n         <i class=\"fa fa-lg\" ng-class=\"{\'fa-question-circle-o\':!group.showChildren, \'fa-minus-square-o\': group.showChildren}\"></i>\r\n      </button>\r\n      <div ng-show=\"group.showChildren\" style=\"padding-left:8px\">\r\n         {{group.definition}}<br/><br/>\r\n         This group is made up of the following categories and feature types:\r\n         <div ng-repeat=\"category in group.categories\" style=\"padding-left:8px\">\r\n            <placenames-group-children category=\"category\"></placenames-group-children>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/summary/summary.html","<div class=\"placenames\" ng-show=\"item\">\r\n   <button class=\"undecorated placenames-unstick\" ng-click=\"close()\" style=\"float:right\">X</button>\r\n   <div class=\"container-fluid\">\r\n      <div class=\"row\">\r\n         <div class=\"col-md-12 pn-header placenames-title\">\r\n            {{item.name}}\r\n         </div>\r\n      </div>\r\n   </div>\r\n   <div class=\"container-fluid\">\r\n      <div class=\"row\">\r\n         <div class=\"col-md-4\" title=\"An authority can be a state department or other statutory authority\">Authority</div>\r\n         <div class=\"col-md-8\">{{item.authority}}</div>\r\n      </div>\r\n      <div class=\"row\">\r\n         <div class=\"col-md-4\" title=\"Features belong to a category and categories belong to a group\">Feature Type</div>\r\n         <div class=\"col-md-8\">{{item.feature}}</div>\r\n      </div>\r\n      <div class=\"row\" title=\"Features belong to a category and categories belong to a group\">\r\n         <div class=\"col-md-4\">Category</div>\r\n         <div class=\"col-md-8\">{{item.category}}</div>\r\n      </div>\r\n      <div class=\"row\" title=\"Features belong to a category and categories belong to a group\">\r\n         <div class=\"col-md-4\">Group</div>\r\n         <div class=\"col-md-8\">{{item.group}}</div>\r\n      </div>\r\n      <div class=\"row\">\r\n         <div class=\"col-md-4\">Lat / Lng</div>\r\n         <div class=\"col-md-8\">\r\n            <span class=\"pn-numeric\">\r\n               {{latLng[0]}}&deg; / {{latLng[1]}}&deg;\r\n            </span>\r\n         </div>\r\n      </div>\r\n\r\n   </div>\r\n</div>");
$templateCache.put("placenames/search/quicksearch.html","<div class=\"search-text\" style=\"color:black; width: 26em\" title=\"Start typing in the filter field. Up to twenty matches will be shown as you type with those nearest your map center at the top of the list. The results are restricted to your map\'s field of view so zooming the map in or out will change the number of results.\">\r\n   <div class=\"input-group input-group-sm\" style=\"width:100%\">\r\n      <input class=\"hide\"></input>\r\n      <input type=\"text\" ng-model=\"state.filter\" placeholder=\"Match by feature name...\" placenames-on-enter=\"search($item, $model, $label)\"\r\n         ng-model-options=\"{ debounce: 300}\" typeahead-on-select=\"search($item, $model, $label)\" typeahead-focus-first=\"false\"\r\n         typeahead-template-url=\"placenames/search/typeahead.html\" class=\"form-control\" typeahead-min-length=\"1\"\r\n         uib-typeahead=\"doc as doc.name for doc in loadDocs(state.filter)\" typeahead-loading=\"loadingLocations\" typeahead-no-results=\"noResults\"\r\n         placenames-clear>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/search/typeahead.html","<a placenames-options ng-mouseenter=\"enter()\" ng-mouseleave=\"leave()\"  tooltip-append-to-body=\"true\"\r\n               tooltip-placement=\"bottom\" uib-tooltip-html=\"match.model | placenamesTooltip\">\r\n   <span ng-bind-html=\"match.model.name | uibTypeaheadHighlight:query\"></span>\r\n   (<span ng-bind-html=\"match.model.authority + \' - \' + match.model.feature\"></span>)\r\n</a>");}]);