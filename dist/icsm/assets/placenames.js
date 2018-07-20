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
   angular.module("placenames.authorities", []).directive('placenamesAuthorities', ["groupsService", "searchService", function (groupsService, searchService) {
      return {
         restrict: 'EA',
         templateUrl: "placenames/authorities/authorities.html",
         link: function link(scope) {
            groupsService.getAuthorities().then(function (authorities) {
               return scope.authorities = authorities;
            });
            scope.change = function (item) {
               searchService.filtered();
            };
         }
      };
   }]);
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
'use strict';

{
   angular.module("placenames.pill", []).directive('placenamesPill', ['searchService', function (searchService) {
      return {
         restrict: 'EA',
         templateUrl: "placenames/pill/pill.html",
         scope: {
            item: "=",
            update: "&",
            name: "@?"
         },
         link: function link(scope) {
            if (scope.item.label) {
               scope.label = scope.item.label.charAt(0).toUpperCase() + scope.item.label.slice(1) + ": ";
            }

            if (!scope.name) {
               scope.name = "name";
            }
            scope.deselect = function () {
               scope.item.selected = false;
               searchService.filtered();
            };
         }
      };
   }]);
}
'use strict';

{
   angular.module("placenames.quicksearch", ['placenames.templates', 'placenames.search.service', 'placenames.search', 'placenames.pill']).directive('placenamesQuicksearch', [function () {
      return {
         link: function link() {},
         templateUrl: "placenames/quicksearch/quicksearch.html"
      };
   }]).directive('placenamesFilteredSummary', ["searchService", function (searchService) {
      return {
         scope: {
            state: "="
         },
         templateUrl: "placenames/quicksearch/filteredsummary.html",
         link: function link(scope) {
            scope.summary = searchService.summary;
         }
      };
   }]).filter("quicksummary", [function () {
      return function (items, key) {
         return items.map(function (item) {
            return item[key] + "(" + item.count + ")";
         }).join(", ");
      };
   }]);
}
'use strict';

{
   angular.module("placenames.search", ['placenames.authorities', 'placenames.templates', 'placenames.groups', 'placenames.tree']).directive('placenamesClear', ['searchService', function (searchService) {
      return {
         link: function link(scope, element) {
            searchService.onMapUpdate(listening);
            function listening() {
               if (element.is(":focus")) {
                  var e = $.Event("keydown");
                  e.which = 27; // # Some key code value
                  element.trigger(e);
                  element.blur();
               }
            }
         }
      };
   }]).directive('placenamesOnEnter', function () {
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
   }).directive('placenamesSearchFilters', ["searchService", function (searchService) {
      return {
         templateUrl: "placenames/search/searchfilters.html",
         link: function link(scope) {
            scope.summary = searchService.summary;
            scope.data = searchService.data;
         }
      };
   }]).directive('placenamesOptions', ['searchService', function (searchService) {
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

            scope.clear = function () {
               scope.state.searched = null;
               $timeout(function () {
                  $rootScope.$broadcast("clear.button.fired");
               }, 10);
            };

            scope.search = function search(item) {
               scope.showFilters = false;
               searchService.goto(item);
               $timeout(function () {
                  $rootScope.$broadcast("search.button.fired", item);
               }, 100);
            };
         }
      };
   }]).directive("placenamesSearch", ['$timeout', 'groupsService', 'searchService', function ($timeout, groupsService, searchService) {
      return {
         templateUrl: 'placenames/search/search.html',
         restrict: 'AE',
         link: function link(scope) {
            scope.state = searchService.data;
            scope.status = {};

            scope.$watch("state.searched", function (newVal, oldVal) {
               if (!newVal && oldVal) {
                  searchService.filtered();
               }
            });

            searchService.filtered();
            scope.update = function () {
               searchService.filtered();
            };

            scope.loadOnEmpty = function () {
               if (!scope.state.filter) {
                  searchService.filtered();
               }
            };

            scope.select = function (item) {
               scope.search(item);
            };

            scope.deselect = function (facet) {
               facet.selected = false;
               searchService.filtered();
            };
         }
      };
   }]).filter('placenamesDocName', [function () {
      return function (docs) {
         return docs ? docs.map(function (doc) {
            return doc.name + " (" + doc.authorityId + ")";
         }) : [];
      };
   }]).filter('placenamesSomeSelected', [function () {
      return function (facets) {
         return facets ? Object.keys(facets).some(function (key) {
            return facets[key].selected;
         }) : false;
      };
   }]).filter('placenamesUnselectedFacets', [function () {
      return function (facets) {
         return !facets ? [] : facets.filter(function (facet) {
            return !facet.selected;
         });
      };
   }]).filter('placenamesSelectedFacets', [function () {
      return function (facets) {
         return !facets ? [] : facets.filter(function (facet) {
            return facet.selected;
         });
      };
   }]).filter('placenamesClean', [function () {
      return function (str) {
         return str.replace(/\s?[, ]\s?/g, " ");
      };
   }]).filter('placenamesTooltip', [function () {
      return function (model) {
         var buffer = "<div style='text-align:left'>";
         if (model.variant) {
            (function () {
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
            })();
         }
         buffer += "Lat " + model.location.split(" ").reverse().join("&deg; Lng ") + "&deg;<br/>Feature type: " + model.feature + "</div>";

         return buffer;
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

   SearchService.$inject = ['$http', '$rootScope', '$timeout', 'groupsService', 'mapService'];
}

function SearchService($http, $rootScope, $timeout, groupsService, mapService) {
   var data = {
      searched: null // Search results
   };

   var countsMapping = {
      group: "groups",
      authority: "authorities",
      feature: "features",
      category: "categories"
   };

   var summary = {};
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
         return _filtered().then(function (response) {
            data.filtered = response;
            var params = response.responseHeader.params;
            filteredAuthorities(params);
            filteredCurrent(params);
            return response;
         });
      },
      request: function request(params) {
         return _request(params);
      },
      search: function search(item) {
         var _this = this;

         if (item) {
            select(item.recordId).then(function () {
               return _this.searched();
            });
         } else {
            this.searched();
         }
      },
      persist: function persist(params, response) {
         data.persist = {
            params: params,
            data: response
         };
         return mapService.getMap().then(function (map) {
            return data.persist.bounds = map.getBounds();
         });
      },
      searched: function searched() {
         data.searched = data.persist;
         data.searched.data.restrict = map.getBounds();
         this.hide();
      },
      goto: function goto(what) {
         return mapService.getMap().then(function (map) {
            return map.panTo(what.location.split(" ").reverse().map(function (str) {
               return +str;
            }));
         });
      },
      show: function show(what) {
         this.hide().then(function (map) {
            // split lng/lat string seperated by space, reverse to lat/lng, cooerce to numbers
            var location = what.location.split(" ").reverse().map(function (str) {
               return +str;
            });
            marker = L.popup().setLatLng(location).setContent(what.name + "<br/>Lat/Lng: " + location[0] + "&deg;" + location[1] + "&deg;").openOn(map);
         });
      },
      hide: function hide(what) {
         return mapService.getMap().then(function (map) {
            if (marker) {
               map.removeLayer(marker);
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

   // We replace the search parameters like filters with a unique record ID.
   function select(recordId) {
      return createParams().then(function (params) {
         params.q = "recordId:" + recordId;
         return run(params).then(function (response) {
            return service.persist(params, response).then(function () {
               decorateCounts(response.facet_counts.facet_fields);
               $rootScope.$broadcast('pn.search.complete', response);
               return response;
            });
         });
      });
   }

   function _filtered() {
      return createParams().then(function (params) {
         return run(params).then(function (response) {
            return service.persist(params, response).then(function () {
               decorateCounts(response.facet_counts.facet_fields);
               $rootScope.$broadcast('pn.search.complete', response);
               return response;
            });
         });
      });
   }

   function decorateCounts(facets) {
      groupsService.getAll().then(function (response) {

         summary.counts = arraysToMap(facets);

         response.authorities.forEach(function (auth) {
            auth.count = summary.counts.authorities[auth.code];
            auth.count = auth.count ? auth.count : 0;
         });

         ["groups", "features", "categories"].forEach(function (key) {
            response[key].forEach(function (item) {
               item.count = summary.counts[key][item.name];
               item.count = item.count ? item.count : 0;
            });
         });
      });
   }

   function arrayToMap(facets) {
      var lastElement = void 0;
      var counts = {};

      facets.forEach(function (value, index) {
         if (index % 2) {
            counts[lastElement] = value;
         } else {
            lastElement = value;
         }
      });
      return counts;
   }

   function arraysToMap(facets) {
      var lastElement = void 0;
      var counts = {};
      Object.values(countsMapping).forEach(function (value) {
         counts[value] = {};
      });

      Object.keys(facets).forEach(function (key) {
         facets[key].forEach(function (value, index) {
            if (index % 2) {
               counts[countsMapping[key]][lastElement] = value;
            } else {
               lastElement = value;
            }
         });
      });
      return counts;
   }

   function createSummary() {
      return mapService.getMap().then(function (map) {
         return groupsService.getAll().then(function (response) {
            var filterIsObject = _typeof(data.filter) === "object";
            var summary = service.summary;
            summary.filter = filterIsObject ? data.filter.name : data.filter;
            summary.bounds = map.getBounds();
            summary.authorities = response.authorities.filter(function (auth) {
               return auth.selected;
            });
            summary.current = [];
            response.groups.forEach(function (group) {
               return summary.current = summary.current.concat(group.selections());
            });
            return summary;
         });
      });
   }

   function createParams() {
      return createSummary().then(function (summary) {
         var params = baseParameters();
         var bounds = summary.bounds;

         params.fq = getBounds(bounds);
         params["facet.heatmap.geom"] = getHeatmapBounds(bounds);
         params.sort = getSort(bounds);
         params.q = createQText(summary);

         var qs = createCurrentParams();
         var qas = createAuthorityParams();

         if (qas.length) {
            params.q += ' AND (' + qas.join(" ") + ')';
         }

         if (qs.length) {
            params.q += ' AND (' + qs.join(" ") + ')';
         }
         return params;
      });
   }

   function createQText(summary) {
      var q = summary.filter;
      return q ? '"' + q.toLowerCase() + '"' : "*:*";
   }

   function filteredAuthorities(params) {
      return groupsService.getAuthorities().then(function (authorities) {
         if (summary.authorities && summary.authorities.length) {
            // We need get the facets as though no authorities are selected Select against Solr
            var newParams = authBaseParameters();

            var qs = createCurrentParams();
            if (qs.length) {
               newParams.q += ' AND (' + qs.join(" ") + ')';
            }
            newParams.q = createQText(summary);
            newParams.fq = params.fq;

            return _request(newParams).then(function (data) {
               var countMap = arrayToMap(data.facet_counts.facet_fields.authority);
               authorities.forEach(function (auth) {
                  auth.allCount = countMap[auth.code];
               });

               data.facetCounts = {};
               console.log("auth counts", data, summary);
               return data;
            });
         } else {
            // Otherwise we can just use the normal counts to set the allCounts
            authorities.forEach(function (auth) {
               auth.allCount = summary.counts.authorities[auth.code];
            });
            return null;
         }
      });
   }

   function filteredCurrent(params) {
      return groupsService.getGroups().then(function (groups) {

         // We need get the facets as though no filters are selected. Select against Solr
         var newParams = typeBaseParameters(["group", "category", "feature"]);
         newParams.q = createQText(summary);
         var qs = createAuthorityParams();
         if (qs.length) {
            newParams.q += ' AND (' + qs.join(" ") + ')';
         }
         newParams.fq = params.fq;

         return _request(newParams).then(function (data) {
            var groupMap = arrayToMap(data.facet_counts.facet_fields.group);
            var categoryMap = arrayToMap(data.facet_counts.facet_fields.category);
            var featureMap = arrayToMap(data.facet_counts.facet_fields.feature);
            groups.forEach(function (group) {
               group.allCount = groupMap[group.name];
               group.categories.forEach(function (category) {
                  category.allCount = categoryMap[category.name];
                  category.features.forEach(function (feature) {
                     feature.allCount = featureMap[feature.name];
                  });
               });
            });

            data.facetCounts = {};
            return data;
         });
      });
   }

   // We assume summary is already made.
   function createAuthorityParams() {
      return summary.authorities.map(function (auth) {
         return 'authority:' + auth.code;
      });
   }

   // We assume
   // Current is one of group category or feature, which ever panel is open.
   function createCurrentParams() {
      return summary.current.map(function (item) {
         return item.label + ':"' + item.name + '"';
      });
   }

   function run(params) {
      return _request(params).then(function (data) {
         var code = void 0;
         data.facetCounts = {};
         $rootScope.$broadcast("pn.facets.changed", data.facet_counts.facet_fields);

         return data;
      });
   }

   function _request(params) {
      return $http({
         url: "/select?",
         method: "GET",
         params: params,
         cache: true
      }).then(function (response) {
         return response.data;
      });
   }

   function getSort(bounds) {
      var dx = (bounds.getEast() - bounds.getWest()) / 2;
      var dy = (bounds.getNorth() - bounds.getSouth()) / 2;
      return "geodist(ll," + (bounds.getSouth() + dy) + "," + (bounds.getWest() + dx) + ") asc";
   }

   function getHeatmapBounds(bounds) {
      return "[" + Math.max(bounds.getSouth(), -90) + "," + Math.max(bounds.getWest(), -180) + " TO " + Math.min(bounds.getNorth(), 90) + "," + Math.min(bounds.getEast(), 180) + "]";
   }

   function authBaseParameters() {
      return {
         facet: true,
         "facet.field": ["authority"],
         rows: 0,
         wt: "json"
      };
   }

   function typeBaseParameters(types) {
      var response = {
         "facet.limit": -1,
         facet: true,
         rows: 0,
         wt: "json"
      };
      if (types) {
         response["facet.field"] = types;
      }
      return response;
   }

   function baseParameters() {
      return {
         "facet.heatmap.format": "ints2D",
         "facet.heatmap": "location",
         "facet.limit": -1,
         facet: true,
         "facet.field": ["feature", "category", "authority", "group"],
         rows: 50,
         wt: "json"
      };
   }

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
angular.module("placenames.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("placenames/authorities/authorities.html","<div ng-repeat=\"item in authorities\" style=\"width:49%; display:inline-block\">\r\n   <div class=\"ellipsis\" title=\'Jurisdiction: {{item.jurisdiction}}, Authority name: {{item.name}}\'>\r\n      <input type=\"checkbox\" ng-click=\"update()\" ng-model=\"item.selected\" ng-change=\"change()\">\r\n      <span>\r\n         <a target=\"_blank\" href=\"http://www.google.com/search?q={{item.name}}\">{{item.code}}</a>\r\n         ({{(item.allCount | number) + (item.allCount || item.allCount == 0?\' of \':\'\')}}{{item.total | number}})\r\n      </span>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/categories/categories.html","<div>\r\n   <div ng-repeat=\"category in categories | orderBy: \'name\'\" ng-attr-title=\"{{category.definition}}\">\r\n      <input type=\"checkbox\" ng-model=\"category.selected\" ng-change=\"change()\">\r\n      <span title=\"[Group: {{category.parent.name}}], {{category.definition}}\">\r\n         {{category.name}}\r\n         ({{(category.allCount | number) + (category.allCount || category.allCount == 0?\' of \':\'\')}}{{category.total}})\r\n      </span>\r\n      <button class=\"undecorated\" ng-click=\"category.showChildren = !category.showChildren\">\r\n         <i class=\"fa fa-lg\" ng-class=\"{\'fa-question-circle-o\':!category.showChildren, \'fa-minus-square-o\': category.showChildren}\"></i>\r\n      </button>\r\n      <div ng-show=\"category.showChildren\" style=\"padding-left: 8px; border-bottom: solid 1px lightgray\">\r\n         <div>[Group: {{category.parent.name}}]\r\n         <div ng-if=\"category.definition\">{{category.definition}}</div>\r\n         It includes the following feature types:\r\n         <placenames-category-children features=\"category.features\"></placenames-category-children>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/categories/features.html","<div>\n   <div ng-repeat=\"feature in features\" style=\"padding-left:10px\" title=\"{{feature.definition}}\">\n      - {{feature.name}} ({{feature.total}})\n   </div>\n</div>");
$templateCache.put("placenames/features/features.html","<div>\r\n      <div ng-repeat=\"feature in features | orderBy: \'name\'\" title=\"{{feature.definition}}\">\r\n         <input type=\"checkbox\" ng-model=\"feature.selected\" ng-change=\"change()\">\r\n         <span title=\"[Group/category: {{feature.parent.parent.name}}/{{feature.parent.name}}], {{feature.definition}}\">\r\n            {{feature.name}} ({{(feature.allCount | number) + (feature.allCount || feature.allCount == 0?\' of \':\'\')}}{{feature.total}})\r\n         </span>\r\n         <button class=\"undecorated\" ng-click=\"feature.showChildren = !feature.showChildren\">\r\n            <i class=\"fa fa-lg\" ng-class=\"{\'fa-question-circle-o\':!feature.showChildren, \'fa-minus-square-o\': feature.showChildren}\"></i>\r\n         </button>\r\n         <div ng-show=\"feature.showChildren\" style=\"padding-left: 8px; border-bottom: solid 1px lightgray\">\r\n            <div ng-if=\"feature.definition\">{{feature.definition}}</div>\r\n            [Group/Category: {{feature.parent.parent.name}}/{{feature.parent.name}}]\r\n         </div>\r\n      </div>\r\n   </div>");
$templateCache.put("placenames/groups/category.html","\r\n<div style=\"padding-left:10px\">\r\n   - <span ng-attr-title=\"{{category.definition}}\">{{category.name}}</span>\r\n   <div ng-repeat=\"feature in category.features | orderBy:\'name\'\" style=\"padding-left:10px\">\r\n      - <span ng-attr-title=\"{{feature.definition}}\">{{feature.name}}</span>\r\n   </div>\r\n</div>\r\n");
$templateCache.put("placenames/groups/groups.html","<div>\r\n   <div ng-repeat=\"group in data.groups\">\r\n      <input type=\"checkbox\" ng-model=\"group.selected\" ng-change=\"change()\"><span title=\"{{group.definition}}\">\r\n         {{group.name}} ({{(group.allCount | number) + (group.allCount || group.allCount == 0?\' of \':\'\')}}{{group.total | number}})\r\n      <button class=\"undecorated\" ng-click=\"group.showChildren = !group.showChildren\">\r\n         <i class=\"fa fa-lg\" ng-class=\"{\'fa-question-circle-o\':!group.showChildren, \'fa-minus-square-o\': group.showChildren}\"></i>\r\n      </button>\r\n      <div ng-show=\"group.showChildren\" style=\"padding-left:8px\">\r\n         {{group.definition}}<br/><br/>\r\n         This group is made up of the following categories and feature types:\r\n         <div ng-repeat=\"category in group.categories\" style=\"padding-left:8px\">\r\n            <placenames-group-children category=\"category\"></placenames-group-children>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/filters/tree.html","<div style=\"max-height:300px; overflow-y:auto;padding-left:10px;\">\r\n   <div ng-repeat=\"group in groups | withTotals\">\r\n      <button class=\"undecorated\" ng-click=\"group.expanded = !group.expanded\" ng-style=\"{color:group.color}\">\r\n         <i class=\"fa\" ng-class=\"{\'fa-plus\':!group.expanded, \'fa-minus\':group.expanded}\"></i>\r\n      </button>\r\n      <input type=\"checkbox\" class=\"filters-check\" ng-model=\"group.selectExpand\" ng-change=\"change(group)\" ng-style=\"{color:group.color}\">\r\n      <span title=\"{{group.definition}}\">\r\n         {{group.name}} ({{(group.allCount | number) + (group.allCount || group.allCount == 0?\' of \':\'\')}}{{group.total | number}})\r\n      </span>\r\n      <div style=\"padding-left:10px\" ng-show=\"group.expanded\">\r\n         <div ng-repeat=\"category in group.categories | withTotals | orderBy: \'name\'\"  ng-attr-title=\"{{category.definition}}\">\r\n            <button class=\"undecorated\" ng-click=\"category.expanded = !category.expanded\" ng-style=\"{color:category.color}\">\r\n               <i class=\"fa\" ng-class=\"{\'fa-plus\':!category.expanded, \'fa-minus\':category.expanded}\"></i>\r\n            </button>\r\n            <input class=\"filters-check\" type=\"checkbox\" ng-model=\"category.selectExpand\" ng-change=\"change()\" ng-style=\"{color:category.color}\">\r\n            <span title=\"{{category.definition}}\">\r\n               {{category.name}}\r\n               ({{(category.allCount | number) + (category.allCount || category.allCount == 0?\' of \':\'\')}}{{category.total}})\r\n            </span>\r\n            <div ng-show=\"category.expanded\" style=\"padding-left:20px\">\r\n               <div ng-repeat=\"feature in category.features | withTotals | orderBy: \'name\'\"  ng-attr-title=\"{{feature.definition}}\">\r\n                  <i class=\"fa fa-hand-o-right\" aria-hidden=\"true\" ng-style=\"{color:feature.color}\"></i>\r\n                  <input class=\"filters-check\" type=\"checkbox\" ng-model=\"feature.selected\" ng-change=\"change()\" ng-style=\"{color:feature.color}\">\r\n                  <span>\r\n                     {{feature.name}}\r\n                     ({{(feature.allCount | number) + (feature.allCount || feature.allCount == 0?\' of \':\'\')}}{{feature.total}})\r\n                  </span>\r\n               </div>\r\n            </div>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/pill/pill.html","<span class=\"btn btn-primary pn-pill\" ng-style=\"item.color?{\'background-color\':item.color, \'padding-top\': \'3px\'}: {\'padding-top\': \'3px\'}\">\r\n   <span style=\"max-width:100px;display:inline-block\" title=\"{{label + item[name]}}\" class=\"ellipsis\">{{item[name]}}</span>\r\n   <span class=\"ellipsis\" style=\"max-width:100px;display:inline-block\">\r\n      ({{item.count?item.count:0 | number}})\r\n      <a ng-click=\"deselect()\" href=\"javascript:void(0)\" title=\"Remove from filters\">\r\n         <i class=\"fa fa-close fa-xs\" style=\"color: white\"></i>\r\n      </a>\r\n   </span>\r\n</span>");
$templateCache.put("placenames/quicksearch/filteredsummary.html","<span class=\"placenames-filtered-summary-child\">\r\n   <span style=\"font-weight:bold; margin:5px;\">\r\n      Matched {{state.persist.data.response.numFound | number}}\r\n   </span>\r\n   <span ng-if=\"summary.authorities.length\">\r\n      <span style=\"font-weight:bold\">| For authorities:</span>\r\n      <placenames-pill ng-repeat=\"item in summary.authorities\" name=\"code\" item=\"item\" update=\"update()\"></placenames-pill>\r\n   </span>\r\n   <span ng-if=\"summary.current.length\">\r\n      <span style=\"font-weight:bold\"> | Filtered by {{summary.filterBy}}:</span>\r\n      <placenames-pill ng-repeat=\"item in summary.current\" item=\"item\" update=\"update()\"></placenames-pill>\r\n   </span>\r\n</span>");
$templateCache.put("placenames/quicksearch/quicksearch.html","<div class=\"quickSearch\" placenames-quick-search></div>\r\n");
$templateCache.put("placenames/search/quicksearch.html","<div class=\"search-text\" style=\"color:black; width: 26em\">\r\n   <div class=\"input-group input-group-sm\" style=\"width:100%\">\r\n      <input class=\"hide\"></input>\r\n      <input type=\"text\" ng-model=\"state.filter\" placeholder=\"Match by feature name...\" placenames-on-enter=\"search()\"\r\n         ng-model-options=\"{ debounce: 300}\" typeahead-on-select=\"search($item, $model, $label)\" typeahead-focus-first=\"false\"\r\n         ng-disabled=\"state.searched\" typeahead-template-url=\"placenames/search/typeahead.html\" class=\"form-control\" typeahead-min-length=\"0\"\r\n         uib-typeahead=\"doc as doc.name for doc in loadDocs(state.filter)\" typeahead-loading=\"loadingLocations\" typeahead-no-results=\"noResults\"\r\n         placenames-clear>\r\n   </div>\r\n</div>\r\n<div class=\"filters\" ng-show=\"showFilters\" style=\"background-color: white;white-space:normal;\">\r\n   <div class=\"panel panel-default\" style=\"margin-bottom:5px\">\r\n      <div class=\"panel-heading\">\r\n         <h4 class=\"panel-title\">\r\n            Filter\r\n            <span ng-if=\"summary.current.length\">ing</span> by groups/categories/features...\r\n         </h4>\r\n      </div>\r\n   </div>\r\n   <placenames-tree></placenames-tree>\r\n   <div class=\"panel panel-default\" style=\"margin-bottom:5px\">\r\n      <div class=\"panel-heading\">\r\n         <h4 class=\"panel-title\">\r\n            Filter\r\n            <span ng-if=\"summary.authorities.length\">ing</span> by authority...\r\n         </h4>\r\n      </div>\r\n      <div class=\"panel-body\" style=\"max-height: 200px; overflow-y: auto; padding:5px\">\r\n         <placenames-authorities update=\"update()\"></placenames-authorities>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/search/search.html","<placenames-results data=\"state\"></placenames-results>\r\n");
$templateCache.put("placenames/search/searchfilters.html","<div style=\"padding-top:5px; padding-bottom:5px; color:black\">\r\n   <span ng-if=\"data.filter && !data.filter.location\">Matching names like \"{{summary.filter}}\"</span>\r\n   <span ng-if=\"summary.current.length\">Filtered by: {{summary.current | quicksummary : \"name\" }}</span>\r\n   <span ng-if=\"summary.authorities.length\">For authorities: {{summary.authorities | quicksummary : \"code\"}}</span>\r\n</div>");
$templateCache.put("placenames/search/typeahead.html","<a placenames-options ng-mouseenter=\"enter()\" ng-mouseleave=\"leave()\"  tooltip-append-to-body=\"true\"\r\n               tooltip-placement=\"bottom\" uib-tooltip-html=\"match.model | placenamesTooltip\">\r\n   <span ng-bind-html=\"match.model.name | uibTypeaheadHighlight:query\"></span>\r\n   (<span ng-bind-html=\"match.model.authority + \' - \' + match.model.feature\"></span>)\r\n</a>");}]);