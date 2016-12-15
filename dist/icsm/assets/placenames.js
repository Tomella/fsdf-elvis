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

(function (angular) {

	'use strict';

	angular.module("PlacenamesApp", ['placenames.header', 'placenames.panes', "placenames.results", "placenames.templates", "placenames.search", 'placenames.toolbar', "placenames.utils", 'geo.map', 'common.altthemes', 'common.baselayer.control', 'common.navigation', 'common.proxy', 'common.scroll', 'common.storage', 'common.templates', 'explorer.config', 'explorer.confirm', 'explorer.drag', 'explorer.enter', 'explorer.flasher', 'explorer.googleanalytics', 'explorer.httpdata', 'explorer.info', 'explorer.legend', 'explorer.message', 'explorer.modal', 'explorer.projects', 'explorer.tabs', 'explorer.version', 'exp.ui.templates', 'ui.bootstrap', 'ui.bootstrap-slider', 'ngAutocomplete', 'ngRoute', 'ngSanitize', 'page.footer'])

	// Set up all the service providers here.
	.config(['configServiceProvider', 'projectsServiceProvider', 'versionServiceProvider', function (configServiceProvider, projectsServiceProvider, versionServiceProvider) {
		configServiceProvider.location("icsm/resources/config/placenames.json");
		configServiceProvider.dynamicLocation("icsm/resources/config/appConfig.json?t=");
		versionServiceProvider.url("icsm/assets/package.json");
		projectsServiceProvider.setProject("icsm");
	}]).run(['mapService', function (mapService) {
		mapService.getMap().then(function (map) {
			map.options.maxZoom = 16;
		});
	}]).factory("userService", [function () {
		return {
			login: noop,
			hasAcceptedTerms: noop,
			setAcceptedTerms: noop,
			getUsername: function getUsername() {
				return "anon";
			}
		};
		function noop() {
			return true;
		}
	}]).controller("RootCtrl", RootCtrl);

	RootCtrl.$invoke = ['$http', 'configService'];
	function RootCtrl($http, configService) {
		var self = this;
		configService.getConfig().then(function (data) {
			self.data = data;
			// If its got WebGL its got everything we need.
			try {
				var canvas = document.createElement('canvas');
				data.modern = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
			} catch (e) {
				data.modern = false;
			}
		});
	}
})(angular);
'use strict';

(function (angular) {

	'use strict';

	angular.module('placenames.header', []).controller('headerController', ['$scope', '$q', '$timeout', function ($scope, $q, $timeout) {

		var modifyConfigSource = function modifyConfigSource(headerConfig) {
			return headerConfig;
		};
		$scope.$on('headerUpdated', function (event, args) {
			$scope.headerConfig = modifyConfigSource(args);
		});
	}]).directive('placenamesHeader', [function () {
		var defaults = {
			heading: "Place Names",
			headingtitle: "Place Names",
			helpurl: "help.html",
			helptitle: "Get help about Place Names",
			helpalttext: "Get help about Place Names",
			skiptocontenttitle: "Skip to content",
			skiptocontent: "Skip to content",
			quicklinksurl: "/search/api/quickLinks/json?lang=en-US"
		};
		return {
			transclude: true,
			restrict: 'EA',
			templateUrl: "placenames/header/header.html",
			scope: {
				breadcrumbs: "=",
				heading: "=",
				headingtitle: "=",
				helpurl: "=",
				helptitle: "=",
				helpalttext: "=",
				skiptocontenttitle: "=",
				skiptocontent: "=",
				quicklinksurl: "="
			},
			link: function link(scope, element, attrs) {
				var data = angular.copy(defaults);
				angular.forEach(defaults, function (value, key) {
					if (!(key in scope)) {
						scope[key] = value;
					}
				});
			}
		};
	}]).factory('headerService', ['$http', function () {}]);
})(angular);
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {
	'use strict';

	var PaneCtrl = function PaneCtrl(paneService) {
		_classCallCheck(this, PaneCtrl);

		paneService.data().then(function (data) {
			this.data = data;
		}.bind(this));
	};

	PaneCtrl.$inject = ["paneService"];

	PaneService.$inject = [];
	function PaneService() {
		var data = {};

		return {
			add: function add(item) {},

			remove: function remove(item) {}
		};
	}

	angular.module("placenames.panes", []).directive("placenamesPanes", ['$rootScope', '$timeout', 'mapService', function ($rootScope, $timeout, mapService) {
		return {
			templateUrl: "placenames/panes/panes.html",
			transclude: true,
			scope: {
				defaultItem: "@",
				data: "="
			},
			controller: ['$scope', function ($scope) {
				var changeSize = false;

				$scope.view = $scope.defaultItem;

				$scope.setView = function (what) {
					var oldView = $scope.view;

					if ($scope.view === what) {
						if (what) {
							changeSize = true;
						}
						$scope.view = "";
					} else {
						if (!what) {
							changeSize = true;
						}
						$scope.view = what;
					}

					$rootScope.$broadcast("view.changed", $scope.view, oldView);

					if (changeSize) {
						mapService.getMap().then(function (map) {
							map._onResize();
						});
					}
				};
				$timeout(function () {
					$rootScope.$broadcast("view.changed", $scope.view, null);
				}, 50);
			}]
		};
	}]).directive("placenamesTabs", [function () {
		return {
			templateUrl: "placenames/panes/tabs.html",
			require: "^placenamesPanes"
		};
	}]).controller("PaneCtrl", PaneCtrl).factory("paneService", PaneService);
})(angular);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/*!
 * Copyright 2016 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {
   'use strict';

   angular.module("placenames.search", []).directive('placenamesClear', ['placenamesSearchService', function (placenamesSearchService) {
      return {
         link: function link(scope, element) {
            placenamesSearchService.onMapUpdate(listening);
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
   }]).directive('placenamesOptions', ['placenamesSearchService', function (placenamesSearchService) {
      return {
         link: function link(scope) {
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
   }]).directive("placenamesSearch", ['$timeout', 'placenamesSearchService', function ($timeout, placenamesSearchService) {
      return {
         templateUrl: 'placenames/search/search.html',
         restrict: 'AE',
         link: function link(scope) {
            scope.state = placenamesSearchService.data;

            scope.$watch("state.searched", function (newVal, oldVal) {
               if (!newVal && oldVal) {
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
               return placenamesSearchService.filtered().then(function (fetched) {
                  return fetched.response.docs;
               });
            };
         }
      };
   }]).filter('pnDocName', [function () {
      return function (docs) {
         return docs ? docs.map(function (doc) {
            return doc.name + " (" + doc.recordId + ")";
         }) : [];
      };
   }]).filter('pnSomeSelected', [function () {
      return function (facets) {
         return facets ? Object.keys(facets).some(function (key) {
            return facets[key].selected;
         }) : false;
      };
   }]).filter('pnUnselectedFacets', [function () {
      return function (facets) {
         return !facets ? [] : Object.keys(facets).filter(function (key) {
            return !facets[key].selected;
         }).map(function (key) {
            return facets[key];
         });
      };
   }]).filter('pnSelectedFacets', [function () {
      return function (facets) {
         return !facets ? [] : Object.keys(facets).filter(function (key) {
            return facets[key].selected;
         }).map(function (key) {
            var facet = facets[key];
            facet.code = key;
            return facet;
         });
      };
   }]).filter('pnClean', [function () {
      return function (str) {
         return str.replace(/\s?[, ]\s?/g, " ");
      };
   }]).filter('pnTooltip', [function () {
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
         buffer += "Lat " + model.location.split(" ").reverse().join("&deg; Lng ") + "&deg;<br/>Classification: " + model.classification + "</div>";

         return buffer;
      };
   }]).factory('placenamesSearchService', SearchService);

   SearchService.$inject = ['$http', '$rootScope', '$timeout', 'configService', 'mapService'];
   function SearchService($http, $rootScope, $timeout, configService, mapService) {
      var data = {
         searched: false, // Search results
         featureCodes: []
      };
      var mapListeners = [];

      var results;
      var marker;

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

         filtered: function filtered() {
            return _filtered().then(function (response) {
               data.filtered = response;
               return response;
            });
         },
         request: function request(params) {
            return _request(params);
         },
         search: function search(item) {
            if (item) {
               data.persist.item = item;
            }
            this.searched();
         },
         persist: function persist(params, response) {
            data.persist = {
               params: params,
               data: response
            };
         },
         searched: function searched() {
            data.searched = true;
            this.hide();
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

      configService.getConfig("classifications").then(function (config) {
         data.classifications = {};

         Object.keys(config).forEach(function (key) {
            data.classifications[key] = {
               name: config[key]
            };
         });
      });

      mapService.getMap().then(function (map) {
         var timeout;
         var facets = {
            facet: true,
            "facet.field": "featureCode"
         };

         map.on('resize moveend viewreset', function () {
            $timeout.cancel(timeout);
            if (!data.searched) {
               timeout = $timeout(function () {
                  service.filtered();
               }, 200);
               mapListeners.forEach(function (listener) {
                  listener();
               });
            }
         });
      });

      function _filtered() {
         return createParams().then(function (params) {
            return run(params).then(function (data) {
               service.persist(params, data);
               return data;
            });
         });
      }

      function createParams() {
         return mapService.getMap().then(function (map) {
            var types = data.classifications;
            var features = Object.keys(types).filter(function (key) {
               return types[key].selected;
            });
            var params = baseParameters();
            var filterIsObject = _typeof(data.filter) === "object";
            var q = filterIsObject ? data.filter.name : data.filter;

            params.fq = getBounds(map);
            params.sort = getSort(map);
            params.q = q ? '"' + q.toLowerCase() + '"' : "*:*";
            if (features.length) {
               if (features.length === 1) {
                  params.q += " AND featureCode:" + features[0];
               } else {
                  params.q += " AND (featureCode:(" + features.map(function (code) {
                     return "featureCode:" + code;
                  }).join(" ") + "))";
               }
            }
            return params;
         });
      }

      function run(params) {
         return _request(params).then(function (data) {
            var code;
            data.facetCounts = {};
            // Transform the facets into something useful
            data.facet_counts.facet_fields.featureCode.forEach(function (value, index) {
               if (index % 2 === 0) {
                  code = value;
               } else {
                  data.facetCounts[code] = {
                     count: value,
                     code: code
                  };
               }
            });
            decorateFeatureNames(data.facetCounts);
            return data;
         });
      }

      function _request(params) {
         return $http({
            url: "/select",
            method: "GET",
            params: params,
            cache: true
         }).then(function (response) {
            return response.data;
         });
      }

      function decorateFeatureNames(features) {
         Object.keys(features).forEach(function (key) {
            features[key].parent = data.classifications[key];
         });
      }

      function getSort(map) {
         var bounds = map.getBounds();
         var dx = (bounds.getEast() - bounds.getWest()) / 2;
         var dy = (bounds.getNorth() - bounds.getSouth()) / 2;
         return "geodist(ll," + (bounds.getSouth() + dy) + "," + (bounds.getWest() + dx) + ") asc";
      }

      function getBounds(map) {
         var bounds = map.getBounds();
         return "location:[" + Math.max(bounds.getSouth(), -90) + "," + Math.max(bounds.getWest(), -180) + " TO " + Math.min(bounds.getNorth(), 90) + "," + Math.min(bounds.getEast(), 180) + "]";
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
"use strict";

(function (angular) {

   'use strict';

   angular.module("placenames.results.item", []).directive("placenamesResultsItem", ['placenamesItemService', 'placenamesResultsService', function (placenamesItemService, placenamesResultsService) {

      return {
         templateUrl: "placenames/results/item.html",
         bindToController: {
            item: "="
         },
         controller: function controller() {
            var _this = this;

            console.log("Creating an item scope");
            this.showPan = function (feature) {
               placenamesResultsService.showPan(feature);
            };

            this.download = function (type) {
               placenamesItemService[type](this);
            };

            placenamesResultsService.load(this.item.id).then(function (data) {
               _this.feature = data.features[0];
            });
         },
         controllerAs: "vm"
      };
   }]).factory('placenamesItemService', ['$http', 'configService', function ($http, configService) {
      var service = {
         esri: function esri(vm) {
            var blob = new Blob([JSON.stringify(vm.feature, null, 3)], { type: "application/json;charset=utf-8" });
            saveAs(blob, "gazetteer-esri-feature-" + vm.item.recordId + ".json");
         },
         wfs: function wfs(vm) {
            configService.getConfig("results").then(function (_ref) {
               var wfsTemplate = _ref.wfsTemplate;

               $http.get(wfsTemplate.replace("${id}", vm.item.id)).then(function (response) {
                  var blob = new Blob([response.data], { type: "application/json;charset=utf-8" });
                  saveAs(blob, "gazetteer-wfs-feature-" + vm.item.recordId + ".xml");
               });
            });
         }
      };
      return service;
   }]);
})(angular);
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

(function (angular) {

   'use strict';

   angular.module("placenames.results", ['placenames.results.item']).directive("placenamesResults", ['placenamesResultsService', function (placenamesResultsService) {
      return {
         templateUrl: 'placenames/results/results.html',
         bindToController: {
            data: "="
         },
         controller: function controller() {
            this.clear = function (data) {
               this.data.persist.item = null;
               this.data.searched = false;
            };

            this.more = function () {
               placenamesResultsService.moreDocs(this.data.persist);
            };

            this.download = function () {
               placenamesResultsService.download(this.data.persist.data.response.docs.map(function (doc) {
                  return doc.id;
               }));
            };
         },
         controllerAs: "ctrl",
         link: function link(scope) {
            scope.$destroy = function () {
               placenamesResultsService.hide();
            };
            placenamesResultsService.moreDocs(scope.ctrl.data.persist);
         }
      };
   }]).factory("placenamesResultsService", ResultsService);

   ResultsService.$inject = ['proxy', '$http', '$rootScope', '$timeout', 'configService', 'mapService', 'placenamesSearchService'];
   function ResultsService(proxy, $http, $rootScope, $timeout, configService, mapService, placenamesSearchService) {
      var ZOOM_IN = 7;
      var marker;

      var service = {
         showPan: function showPan(what) {
            return this.show(what).then(function (details) {
               var map = details.map;
               map.panTo(details.location, { animate: true });
               if (map.getZoom() < ZOOM_IN) {
                  map.setZoom(ZOOM_IN, { animate: true });
               }
               return details;
            });
         },
         show: function show(what) {
            return this.hide().then(function (map) {
               var location = what.location.split(" ").reverse().map(function (str) {
                  return +str;
               });
               // split lng/lat string seperated by space, reverse to lat/lng, cooerce to numbers
               marker = L.popup().setLatLng(location).setContent(what.name + "<br/>Lat/Lng: " + location[0] + "&deg;" + location[1] + "&deg;").openOn(map);

               return {
                  location: location,
                  map: map,
                  marker: marker
               };
            });
         },
         download: function download(ids) {
            this.config.then(function (config) {
               proxy.get(config.esriTemplate.replace("${id}", ids.join(","))).then(function (response) {
                  var blob = new Blob([JSON.stringify(response.data, null, 3)], { type: "application/json;charset=utf-8" });
                  saveAs(blob, "gazetteer-esri-features-" + Date.now() + ".json");
               });
            });
         },
         hide: function hide(what) {
            return mapService.getMap().then(function (map) {
               if (marker) {
                  map.removeLayer(marker);
               }
               return map;
            });
         },


         get config() {
            return configService.getConfig().then(function (config) {
               return config.results;
            });
         },

         load: function load(id) {
            return this.config.then(function (_ref) {
               var esriTemplate = _ref.esriTemplate;

               return proxy.get(esriTemplate.replace("${id}", id), { cache: true }).then(function (response) {
                  return response;
               });
            });
         },
         moreDocs: function moreDocs(persist) {
            var response = persist.data.response;
            var start = response.docs.length;
            if (start >= response.numFound) {
               return;
            }

            var params = persist.params;
            params.start = start;

            placenamesSearchService.request(params).then(function (data) {
               var _response$docs;

               (_response$docs = response.docs).push.apply(_response$docs, _toConsumableArray(data.response.docs));
            });
         }
      };

      return service;
   }
})(angular);
"use strict";

(function (angular) {

	'use strict';

	angular.module("placenames.toolbar", []).directive("placenamesToolbar", [function () {
		return {
			controller: 'toolbarLinksCtrl'
		};
	}])

	/**
  * Override the default mars tool bar row so that a different implementation of the toolbar can be used.
  */
	.directive('placenamesToolbarRow', [function () {
		var DEFAULT_TITLE = "Satellite to Topography bias on base map.";

		return {
			scope: {
				map: "=",
				overlaytitle: "=?"
			},
			restrict: 'AE',
			templateUrl: 'placenames/toolbar/toolbar.html',
			link: function link(scope) {
				scope.overlaytitle = scope.overlaytitle ? scope.overlaytitle : DEFAULT_TITLE;
			}
		};
	}]).controller("toolbarLinksCtrl", ["$scope", "configService", function ($scope, configService) {

		var self = this;
		configService.getConfig().then(function (config) {
			self.links = config.toolbarLinks;
		});

		$scope.item = "";
		$scope.toggleItem = function (item) {
			$scope.item = $scope.item == item ? "" : item;
		};
	}]);
})(angular);
"use strict";

(function (angular) {

   'use strict';

   angular.module("placenames.utils", []).filter("pnSplitBar", function () {
      return function () {
         var val = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";

         var buffer = "";
         val.split("|").forEach(function (name, index, variants) {
            buffer += (index && index < variants.length - 1 ? "," : "") + " ";
            if (index && index === variants.length - 1) {
               buffer += "or ";
            }
            buffer += name;
         });
         return buffer;
      };
   }).filter('pnFeature', ['configService', function (configService) {
      var features;
      configService.getConfig("classifications").then(function (classifications) {
         features = classifications;
      });
      return function (str) {
         return features ? features[str] : str;
      };
   }]).filter("pnGoogleLink", function () {
      var template = "https://www.google.com.au/maps/place/${name}/@${lat},${lng},14z";
      return function (what) {
         if (!what) return "";
         var location = what.location.split(" ");

         return template.replace("${name}", what.name).replace("${lng}", location[0]).replace("${lat}", location[1]);
      };
   }).factory('placenamesUtilsService', ['configService', function (configService) {
      var service = {};

      return service;
   }]);
})(angular);
angular.module("placenames.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("placenames/header/header.html","<div class=\"container-full common-header\" style=\"padding-right:10px; padding-left:10px\">\r\n    <div class=\"navbar-header\">\r\n\r\n        <button type=\"button\" class=\"navbar-toggle\" data-toggle=\"collapse\" data-target=\".ga-header-collapse\">\r\n            <span class=\"sr-only\">Toggle navigation</span>\r\n            <span class=\"icon-bar\"></span>\r\n            <span class=\"icon-bar\"></span>\r\n            <span class=\"icon-bar\"></span>\r\n        </button>\r\n\r\n        <a href=\"http://www.ga.gov.au\" class=\"hidden-xs header-logo\" style=\"padding-right: 0\">\r\n            <img src=\"icsm/resources/img/icsm-logo-sml.gif\" alt=\"ICSM - ANZLIC Committee on Surveying &amp; Mapping\" class=\"elvis-logo\"></img>\r\n        </a>\r\n        <a href=\"/\" class=\"appTitle visible-xs\"><h1 style=\"font-size:120%\">{{heading}}</h1></a>\r\n    </div>\r\n    <div class=\"navbar-collapse collapse ga-header-collapse\">\r\n        <ul class=\"nav navbar-nav\">\r\n            <li class=\"hidden-xs\"><a href=\"/\"><h1 class=\"applicationTitle\">{{heading}}</h1></a></li>\r\n        </ul>\r\n        <ul class=\"nav navbar-nav navbar-right nav-icons\">\r\n        	<li common-navigation ng-show=\"username\" role=\"menuitem\" style=\"padding-right:10px\"></li>\r\n			<li mars-version-display role=\"menuitem\"></li>\r\n			<li style=\"width:10px\"></li>\r\n        </ul>\r\n    </div><!--/.nav-collapse -->\r\n</div>\r\n\r\n<!-- Strap -->\r\n<div class=\"row\">\r\n    <div class=\"col-md-12\">\r\n        <div class=\"strap-blue\">\r\n        </div>\r\n        <div class=\"strap-white\">\r\n        </div>\r\n        <div class=\"strap-red\">\r\n        </div>\r\n    </div>\r\n</div>");
$templateCache.put("placenames/panes/panes.html","<div class=\"container contentContainer\">\r\n	<div class=\"row icsmPanesRow\" >\r\n		<div class=\"icsmPanesCol\" ng-class=\"{\'col-md-12\':!view, \'col-md-7\':view}\" style=\"padding-right:0\">\r\n			<div class=\"expToolbar row noPrint\" placenames-toolbar-row map=\"root.map\" ></div>\r\n			<div class=\"panesMapContainer target\" geo-map configuration=\"data.map\">\r\n			    <geo-extent></geo-extent>\r\n			</div>\r\n    		<div geo-draw data=\"data.map.drawOptions\" line-event=\"elevation.plot.data\" rectangle-event=\"bounds.drawn\"></div>\r\n    		<div placenames-tabs class=\"icsmTabs\"  ng-class=\"{\'icsmTabsClosed\':!view, \'icsmTabsOpen\':view}\"></div>\r\n		</div>\r\n		<div class=\"icsmPanesColRight\" ng-class=\"{\'hidden\':!view, \'col-md-5\':view}\" style=\"padding-left:0; padding-right:0\">\r\n			<div class=\"pnTabContentItem\" ng-show=\"view == \'search\'\" ><placenames-search></placenames-search></div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("placenames/panes/tabs.html","<!-- tabs go here -->\r\n<div id=\"panesTabsContainer\" class=\"paneRotateTabs\" style=\"opacity:0.9\" ng-style=\"{\'right\' : contentLeft +\'px\'}\">\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'search\'}\" ng-click=\"setView(\'search\')\">\r\n		<button class=\"undecorated\">Search</button>\r\n	</div>\r\n</div>\r\n");
$templateCache.put("placenames/search/search.html","<div class=\"pn-search-container\">\r\n   <div ng-if=\"state.searched\" placenames-results data=\"state\"></div>\r\n   <div style=\"float:clear\" ng-show=\"!state.searched\">\r\n      <h4 style=\"font-size:12\">Search by map location, partial name match or feature type</h4>\r\n      <div class=\"search-text\">\r\n         <div class=\"input-group input-group-sm\">\r\n            <span class=\"input-group-addon\" id=\"names1\">Filter:</span>\r\n\r\n            <input type=\"text\" ng-model=\"state.filter\" placeholder=\"Match by feature name...\" ng-model-options=\"{ debounce: 300}\"\r\n                  typeahead-on-select=\"select($item, $model, $label)\" typeahead-template-url=\"placenames/search/typeahead.html\"\r\n                  class=\"form-control\" typeahead-min-length=\"0\" uib-typeahead=\"doc as doc.name for doc in loadDocs(state.filter)\"\r\n                  typeahead-loading=\"loadingLocations\" typeahead-no-results=\"noResults\" placenames-clear>\r\n\r\n            <span class=\"input-group-btn\">\r\n            <button class=\"btn btn-primary\" type=\"button\" ng-click=\"search()\" ng-disabled=\"!state.persist.data\">Search</button>\r\n         </span>\r\n         </div>\r\n      </div>\r\n      <div>\r\n         <div ng-show=\"!(state.classifications | pnSomeSelected)\" style=\"text-align:right\"><strong>Found {{state.filtered.response.numFound | number}} features in map view.</strong></div>\r\n         <div ng-show=\"state.classifications | pnSomeSelected\">\r\n            <strong style=\"float:right\">Found {{state.filtered.response.numFound | number}} features</strong>\r\n            <span class=\"btn btn-primary btn-xs pnPill\" ng-repeat=\"type in state.classifications | pnSelectedFacets\" tooltip-append-to-body=\"true\"\r\n               tooltip-placement=\"left\" uib-tooltip=\"{{type.name}}\">\r\n            <span style=\"max-width:100px;display:inline-block;\" class=\"ellipsis\">{{type.name}}</span>\r\n            <span style=\"max-width:100px;display:inline-block;\" class=\"ellipsis\">\r\n               ({{state.filtered.facetCounts[type.code].count?state.filtered.facetCounts[type.code].count:0}})\r\n               <a ng-click=\"deselect(type)\" href=\"javascript:void(0)\"><i class=\"fa fa-close fa-xs\" style=\"color: white\"></i></a>\r\n            </span>\r\n            </span>\r\n         </div>\r\n      </div>\r\n      <uib-accordion close-others=\"oneAtATime\">\r\n         <div uib-accordion-group class=\"panel-default\" is-open=\"status.open\">\r\n            <uib-accordion-heading>\r\n               Filter by feature type...\r\n               <i class=\"pull-right glyphicon\" ng-class=\"{\'glyphicon-chevron-down\': status.open, \'glyphicon-chevron-right\': !status.open}\"></i>\r\n            </uib-accordion-heading>\r\n            <div ng-repeat=\"facet in state.classifications | pnUnselectedFacets\" class=\"row\">\r\n               <div class=\"col-md-12 ellipsis\">\r\n                  <input type=\"checkbox\" ng-model=\"facet.selected\" ng-change=\"update(facet)\" />\r\n                  <span tooltip-append-to-body=\"true\" tooltip-placement=\"top-left\" uib-tooltip=\"{{facet.name}}\">\r\n                           <a target=\"_blank\" href=\"http://www.google.com/search?q={{facet.name | pnClean}}\">{{facet.name}}</a>\r\n                        </span>\r\n               </div>\r\n            </div>\r\n         </div>\r\n      </uib-accordion>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/search/typeahead.html","<a placenames-options ng-mouseenter=\"enter()\" ng-mouseleave=\"leave()\"  tooltip-append-to-body=\"true\"\r\n               tooltip-placement=\"left\" uib-tooltip-html=\"match.model | pnTooltip\">\r\n   <span ng-bind-html=\"match.model.name | uibTypeaheadHighlight:query\"></span>\r\n   (<span ng-bind-html=\"match.model.recordId\"></span>)\r\n</a>");
$templateCache.put("placenames/results/item.html","<div>\r\n<div class=\"container-fluid\">\r\n   <div class=\"row\">\r\n      <div class=\"col-md-12 pn-header\" >\r\n         <button type=\"button\" class=\"undecorated\" ng-click=\"vm.showPan(vm.item)\"\r\n                tooltip-append-to-body=\"true\" title=\"Zoom to location and mark.\" tooltip-placement=\"left\" uib-tooltip=\"Zoom to location and mark\">\r\n            <i class=\"fa fa-lg fa-flag-o\"></i>\r\n         </button>\r\n         <span><a ng-href=\"{{vm.item | pnGoogleLink}}\" target=\"_google\"\r\n            title=\"View in Google maps. While the location will always be correct, Google will do a best guess at matching the Gazetteer name to its data.\">{{vm.item.name}}</a></span>\r\n         <span class=\"pull-right\">Record ID: {{vm.item.recordId}}</span>\r\n      </div>\r\n   </div>\r\n</div>\r\n<div ng-if=\"!vm.feature\" style=\"padding:20px 10px 130px;\"><i class=\"fa-spinner fa-spin fa fa-lf\"></i>Loading full data&hellip;</div>\r\n<div class=\"container-fluid\" ng-if=\"vm.feature\">\r\n   <div class=\"row\" ng-if=\"vm.feature.attributes.Variant_Name\">\r\n      <div class=\"col-md-4\">Variant Name</div>\r\n      <div class=\"col-md-8\">{{vm.feature.attributes.Variant_Name | pnSplitBar}}</div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">State</div>\r\n      <div class=\"col-md-8\">{{vm.feature.attributes.State}}</div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">Feature Type</div>\r\n      <div class=\"col-md-8\">{{vm.feature.attributes.Feature_code | pnFeature}}</div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">Classification</div>\r\n      <div class=\"col-md-8\">{{vm.feature.attributes.Classification}}</div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">CGDN</div>\r\n      <div class=\"col-md-8\">{{vm.feature.attributes.CGDN}}</div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">Concise Gazetteer</div>\r\n      <div class=\"col-md-8\">{{vm.feature.attributes.Concise_gaz}}</div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">1:100K Map Index</div>\r\n      <div class=\"col-md-8\"><span class=\"pn-numeric\">{{vm.feature.attributes.Map_100K}}</span></div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">Authority</div>\r\n      <div class=\"col-md-8\">{{vm.feature.attributes.Authority_ID}}</div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">Status Description</div>\r\n      <div class=\"col-md-8\">{{vm.feature.attributes.Status_desc}}</div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">Latitude</div>\r\n      <div class=\"col-md-4\">\r\n         <span class=\"pn-numeric\">\r\n            {{vm.feature.attributes.Lat_degrees}}&deg;\r\n            {{vm.feature.attributes.Lat_minutes}}&prime;\r\n            {{vm.feature.attributes.Lat_seconds}}&Prime;\r\n         </span>\r\n      </div>\r\n      <div class=\"col-md-4\">\r\n         <span class=\"pn-numeric\">\r\n            {{vm.feature.attributes.Latitude}}&deg;\r\n         </span>\r\n      </div>\r\n   </div>\r\n\r\n   <div class=\"row\">\r\n      <div class=\"col-md-4\">Longitude</div>\r\n      <div class=\"col-md-4\"><span class=\"pn-numeric\">\r\n         {{vm.feature.attributes.Long_degrees}}&deg;\r\n         {{vm.feature.attributes.Long_minutes}}&prime;\r\n         {{vm.feature.attributes.Long_seconds}}&Prime;\r\n         </span>\r\n      </div>\r\n      <div class=\"col-md-4\">\r\n         <span class=\"pn-numeric\">\r\n         {{vm.feature.attributes.Longitude}}&deg;</span></div>\r\n   </div>\r\n   <div class=\"row\" style=\"padding-top:5px; padding-bottom:5px; background-color:#f8f8ff;border-top:1px solid #f0f0f0\">\r\n      <div class=\"col-md-12\">Download as:\r\n         <span class=\"pull-right\">\r\n            [<a href\"javascript:void()\" ng-click=\"vm.download(\'esri\')\">ESRI JSON Format</a>]\r\n            [<a href\"javascript:void()\" ng-click=\"vm.download(\'wfs\')\">WFS Get Feature</a>]\r\n         </span>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/results/results.html","<div class=\"pn-container\" ng-if=\"ctrl.data.searched\">\r\n   <nav class=\"navbar navbar-default\" style=\"min-height:25px\">\r\n      <div class=\"container-fluid\">\r\n         <div class=\"navbar-header\">\r\n            <div class=\"navbar-brand\">\r\n               <a href=\"#\" ng-click=\"ctrl.clear()\"><i class=\"fa fa-angle-double-left\" aria-hidden=\"true\"></i></a>\r\n               Matched {{ctrl.data.persist.data.response.numFound | number}} features\r\n               <span ng-if=\"!ctrl.data.persist.item\">, nearest {{ctrl.data.persist.data.response.docs.length | number}} features\r\n                  <a href\"javascript:void()\" ng-click=\"ctrl.download()\" uib-tooltip=\"Download listed features in ESRI JSON format\" tooltip-placement=\"bottom\"><i class=\"fa fa-download\"></i></a>\r\n               </span>\r\n            </div>\r\n         </div>\r\n      </div>\r\n   </nav>\r\n\r\n   <div class=\"pn-results\" common-scroller more=\"ctrl.more()\" ng-if=\"ctrl.data.searched\">\r\n      <placenames-results-item ng-if=\"ctrl.data.persist.item\" item=\"ctrl.data.persist.item\"></placenames-results-item>\r\n      <div class=\"pn-results-list\" ng-if=\"!ctrl.data.persist.item\" ng-repeat=\"doc in ctrl.data.persist.data.response.docs\">\r\n         <placenames-results-item item=\"doc\"></placenames-results-item>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("placenames/toolbar/toolbar.html","<div placenames-toolbar>\r\n	<div class=\"row toolBarGroup\">\r\n\r\n		<div class=\"pull-right\">\r\n			<div class=\"btn-toolbar radCore\" role=\"toolbar\"  placenames-toolbar>\r\n				<div class=\"btn-group\">\r\n					<!-- < icsm-state-toggle></icsm-state-toggle> -->\r\n				</div>\r\n			</div>\r\n\r\n			<div class=\"btn-toolbar\" style=\"margin:right:10px;display:inline-block\">\r\n\r\n				<div class=\"btn-group\" title=\"Place names data density transparency\">\r\n					<span class=\"btn btn-default\" common-baselayer-control max-zoom=\"16\"></span>\r\n				</div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");}]);