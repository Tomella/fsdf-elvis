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

	angular.module("WaterApp", ['common.altthemes', 'common.baselayer.control', 'common.bbox', 'common.cc4', 'common.clip', 'common.download', 'common.extent', 'common.header', 'common.navigation', 'common.templates', 'common.toolbar', 'common.wms', 'explorer.config', 'explorer.confirm', 'explorer.drag', 'explorer.enter', 'explorer.flasher', 'explorer.googleanalytics', 'explorer.httpdata', 'explorer.info', 'explorer.legend', 'explorer.message', 'explorer.modal', 'explorer.persist', 'explorer.projects', 'explorer.tabs', 'explorer.version', 'exp.ui.templates', 'explorer.map.templates', 'ui.bootstrap', 'ui.bootstrap-slider', 'ngAutocomplete', 'ngRoute', 'ngSanitize', 'page.footer', 'geo.draw',
	// 'geo.elevation',
	//'icsm.elevation',
	//'geo.extent',
	'geo.geosearch', 'geo.map', 'geo.maphelper', 'geo.measure', 'water.panes', 'water.templates', 'water.select'])

	// Set up all the service providers here.
	.config(['configServiceProvider', 'persistServiceProvider', 'projectsServiceProvider', 'versionServiceProvider', function (configServiceProvider, persistServiceProvider, projectsServiceProvider, versionServiceProvider) {
		configServiceProvider.location("icsm/resources/config/water.json");
		configServiceProvider.dynamicLocation("icsm/resources/config/appConfig.json?t=");
		versionServiceProvider.url("icsm/assets/package.json");
		persistServiceProvider.handler("local");
		projectsServiceProvider.setProject("icsm");
	}]).config(['$routeProvider', function ($routeProvider) {
		$routeProvider.when('/administrativeBoundaries', {
			templateUrl: "admin/app/app.html",
			controller: "adminCtrl",
			controllerAs: "admin"
		}).when('/positioning', {
			templateUrl: "positioning/app/app.html",
			controller: "positioningCtrl",
			controllerAs: "positioning"
		}).when('/placeNames', {
			templateUrl: "placenames/app/app.html",
			controller: "placeNamesCtrl",
			controllerAs: "placeNames"
		}).when('/landParcelAndProperty', {
			templateUrl: "landParcelAndProperty/app/app.html",
			controller: "landParcelAndPropertyCtrl",
			controllerAs: "landParcelAndProperty"
		}).when('/imagery', {
			templateUrl: "imagery/app/app.html",
			controller: "imageryCtrl",
			controllerAs: "imagery"
		}).when('/transport', {
			templateUrl: "transport/app/app.html",
			controller: "transportCtrl",
			controllerAs: "transport"
		}).when('/water', {
			templateUrl: "water/app/app.html",
			controller: "waterCtrl",
			controllerAs: "water"
		}).when('/elevationAndDepth', {
			templateUrl: "elevationAndDepth/app/app.html",
			controller: "elevationAndDepthCtrl",
			controllerAs: "elevationAndDepth"
		}).when('/landCover', {
			templateUrl: "landCover/app/app.html",
			controller: "landCoverCtrl",
			controllerAs: "landCover"
		}).when('/icsm', {
			templateUrl: "icsm/app/app.html",
			controller: "icsmCtrl",
			controllerAs: "icsm"
		}).otherwise({
			redirectTo: "/icsm"
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

	RootCtrl.$invoke = ['$http', 'configService', 'mapService'];
	function RootCtrl($http, configService, mapService) {
		var self = this;
		mapService.getMap().then(function (map) {
			self.map = map;
		});
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
"use strict";

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {

	'use strict';

	angular.module("water.select.service", []).factory("selectService", SelectService);

	SelectService.$inject = ['$http', '$q', '$rootScope', '$timeout', 'mapService', 'configService'];
	function SelectService($http, $q, $rootScope, $timeout, mapService, configService) {
		var LAYER_GROUP_KEY = "Search Layers",
		    baseUrl = "icsm/resources/config/water_select.json",
		    parameters = {
			text: "",
			daterange: {
				enabled: false,
				upper: null,
				lower: null
			},
			bbox: {
				fromMap: true,
				intersects: true,
				yMax: null,
				yMin: null,
				xMax: null,
				xMin: null
			},
			defaultKeywords: [],
			keywords: []
		},
		    timeout,
		    cache,
		    allDocs = {},
		    busy = false,
		    layers = {},
		    selectLayerGroup,
		    normalLayerColor = "#ff7800",
		    hilightLayerColor = 'darkblue',
		    service = {

			getSelectCriteria: function getSelectCriteria() {
				return parameters;
			},

			getLayerGroup: function getLayerGroup() {
				// Prime the layer group
				if (!selectLayerGroup) {
					selectLayerGroup = mapService.getGroup(LAYER_GROUP_KEY);
				}
				return selectLayerGroup;
			},

			setKeywords: function setKeywords(keywords) {},

			setFilter: function setFilter(filter) {},

			refresh: function refresh() {},

			getDaterange: function getDaterange() {
				return parameters.daterange;
			},

			more: function more() {},

			_executeQuery: function _executeQuery() {
				// Give them the lot as they will want the criteria as well
				$http.get(baseUrl, { cache: true }).then(function (response) {
					service.getLayerGroup();

					var data = response.data;

					data.response.docs.forEach(function (dataset) {
						service._decorateDataset(dataset);
						if (dataset.type == "group") {
							dataset.docs.forEach(function (data) {
								service._decorateDataset(data);
							});
						}
					});

					$rootScope.$broadcast("select.facet.counts", data);
					$rootScope.$broadcast("select.results.received", data);
				});
			},

			createLayer: function createLayer(dataset, color) {
				var bbox = dataset.bbox,
				    key = dataset.primaryId,
				    parts,
				    bounds,
				    layer;

				layer = layers[key];
				if (!layer) {

					if (!bbox) {
						return null;
					}

					parts = bbox.split(" ");
					if (parts.length != 4) {
						return null;
					}

					if (!color) {
						color = normalLayerColor;
					}
					bounds = [[+parts[1], +parts[0]], [+parts[3], +parts[2]]];

					// create a black rectangle
					layer = L.rectangle(bounds, {
						fill: false,
						color: "#000000",
						width: 3,
						clickable: false
					});

					layers[key] = layer;
				}
				this._decorateDataset(dataset);
				selectLayerGroup.addLayer(layer);
				return layer;
			},

			_decorateDataset: function _decorateDataset(dataset) {
				var layer = layers[dataset.primaryId];
				if (layer) {
					dataset.layer = layer;
					dataset.showLayer = true;
				} else {
					dataset.layer = null;
					dataset.showLayer = false;
					// Do we add the services to it?
					dataset.services = servicesFactory(dataset.dcUris);
					dataset.bounds = getBounds(dataset.bbox);
				}

				function getBounds(bbox) {
					var parts;
					if (!bbox) {
						return null;
					} else {
						parts = bbox.split(/\s/g);
						return {
							xMin: +parts[0],
							xMax: +parts[2],
							yMax: +parts[3],
							yMin: +parts[1]
						};
					}
				}
			},

			showWithin: function showWithin(datasets) {
				datasets.forEach(function (dataset) {
					var box = dataset.bbox,
					    coords,
					    xmin,
					    ymin,
					    xmax,
					    ymax;

					if (!box) {
						service.removeLayer(dataset);
					} else {
						coords = box.split(" ");
						if (coords.length == 4 && within(+coords[0], +coords[1], +coords[2], +coords[3])) {
							// show
							service.createLayer(dataset);
						} else {
							// hide
							service.removeLayer(dataset);
						}
					}
				});

				function within(xmin, ymin, xmax, ymax) {
					var bbox = parameters.bbox;

					return xmin > bbox.xMin && xmax < bbox.xMax && ymin > bbox.yMin && ymax < bbox.yMax;
				}
			},

			toggle: function toggle(dataset) {
				if (dataset.showLayer) {
					this.removeLayer(dataset);
				} else {
					this.createLayer(dataset);
				}
			},

			toggleAll: function toggleAll(datasets) {
				var self = this,
				    someNotShowing = datasets.some(function (dataset) {
					return !dataset.showLayer;
				});

				datasets.forEach(function (dataset) {
					if (someNotShowing) {
						if (!dataset.showLayer) {
							self.createLayer(dataset);
						}
					} else {
						if (dataset.showLayer) {
							self.removeLayer(dataset);
						}
					}
				});
				return !someNotShowing;
			},

			hideAll: function hideAll(datasets) {
				datasets.forEach(function (dataset) {
					if (dataset.showLayer) {
						service.removeLayer(dataset);
					}
				});
			},

			hilight: function hilight(layer) {
				layer.setStyle({ color: hilightLayerColor });
			},

			lolight: function lolight(layer) {
				layer.setStyle({ color: normalLayerColor });
			},

			removeLayer: function removeLayer(dataset) {
				var key = dataset.primaryId,
				    layer = layers[key];

				if (layer) {
					selectLayerGroup.removeLayer(layer);
					delete layers[key];
				}
				this._decorateDataset(dataset);
			}
		};

		execute();
		return service;

		function execute() {
			$timeout(function () {
				service._executeQuery();
			}, 100);
		}
	}

	function servicesFactory(uris) {
		var protocols = {
			WCS: "OGC:WCS",
			WFS: "OGC:WFS",
			WMS: "OGC:WMS"
		};

		return new Services(uris);

		function Services(uris) {
			this.uris = uris;
			this.container = {
				wcs: null,
				wms: null
			};

			if (uris) {
				this.services = uris.map(function (uri) {
					var service = new Service(uri);

					this.container.wcs = service.isWcs() ? service : this.container.wcs;
					this.container.wms = service.isWms() ? service : this.container.wms;
					return service;
				}.bind(this));
			} else {
				this.services = [];
			}

			this.hasWcs = function () {
				return this.container.wcs !== null;
			};

			this.hasWms = function () {
				return this.container.wms !== null;
			};

			this.getWcs = function () {
				return this.container.wcs;
			};

			this.getWms = function () {
				return this.container.wms;
			};

			this.remove = function () {
				this.services.forEach(function (service) {
					service.remove();
				});
			};
		}

		function Service(doc) {
			var xmlDoc = $(doc);

			this.protocol = xmlDoc.attr("protocol");
			this.url = xmlDoc.text();
			this.layerNames = xmlDoc.attr("layerNames");
			this.name = xmlDoc.attr("name");
			this.description = xmlDoc.attr("description");
			this.handlers = [];

			this.isWcs = function () {
				// console.log("Checking results:" + (this.protocol == protocols.WCS));
				return this.protocol == protocols.WCS;
			};

			this.isWfs = function () {
				return this.protocol == protocols.WFS;
			};

			this.isWms = function () {
				return this.protocol == protocols.WMS;
			};

			this.isSupported = function () {
				return typeof protocols[this.protocol] == "undefined";
			};

			this.addHandler = function (callback) {
				this.handlers.push(callback);
			};

			this.removeHandler = function (callback) {
				this.handlers.push(callback);
			};

			this.remove = function () {
				this.handlers.forEach(function (callback) {
					// They should all have a remove but you never know.
					if (this.callback.remove) {
						callback.remove(this);
					}
				}.bind(this));
				this.handlers = [];
			};
		}

		Service.prototype = {
			getUrl: function getUrl() {
				if (url) {
					if (url.indexOf("?") < 0) {
						return;
					} else {
						return url.substr(0, url.indexOf("?"));
					}
				}
				return null;
			}
		};
	}
})(angular);
'use strict';

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {

	'use strict';

	angular.module("water.select", ['water.select.service']).controller("SelectCtrl", SelectCtrl).controller("SelectCriteriaCtrl", SelectCriteriaCtrl).directive("waterSelect", [function () {
		return {
			templateUrl: "water/select/select.html",
			link: function link(scope, element, attrs) {
				console.log("Hello select!");
			}
		};
	}]).directive("selectDoc", [function () {
		return {
			templateUrl: "water/select/doc.html",
			link: function link(scope, element, attrs) {
				console.log("What's up doc!");
			}
		};
	}]).directive("selectGroup", [function () {
		return {
			templateUrl: "water/select/group.html",
			scope: {
				group: "="
			},
			link: function link(scope, element, attrs) {
				console.log("What's up doc!");
			}
		};
	}])

	/**
  * Format the publication date
  */
	.filter("pubDate", function () {
		return function (string) {
			var date;
			if (string) {
				date = new Date(string);
				return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
			}
			return "-";
		};
	})

	/**
  * Format the array of authors
  */
	.filter("authors", function () {
		return function (auth) {
			if (auth) {
				return auth.join(", ");
			}
			return "-";
		};
	})

	/**
  * If the text is larger than a certain size truncate it and add some dots to the end.
  */
	.filter("truncate", function () {
		return function (text, length) {
			if (text && text.length > length - 3) {
				return text.substr(0, length - 3) + "...";
			}
			return text;
		};
	});

	SelectCriteriaCtrl.$inject = ["selectService"];
	function SelectCriteriaCtrl(selectService) {
		this.criteria = selectService.getSelectCriteria();

		this.refresh = function () {
			selectService.refresh();
		};
	}

	SelectCtrl.$inject = ['$rootScope', 'configService', 'flashService', 'selectService'];
	function SelectCtrl($rootScope, configService, flashService, selectService) {
		var flasher,
		    self = this;

		$rootScope.$on("select.results.received", function (event, data) {
			//console.log("Received response")
			flashService.remove(flasher);
			self.data = data;
		});

		configService.getConfig("facets").then(function (config) {
			this.hasKeywords = config && config.keywordMapped && config.keywordMapped.length > 0;
		}.bind(this));

		this.select = function () {
			flashService.remove(flasher);
			flasher = flashService.add("Selecting", 3000, true);
			selectService.setFilter(this.filter);
		};

		this.toggle = function (result) {
			selectService.toggle(result);
		};

		this.toggleAll = function () {
			selectService.toggleAll(this.data.response.docs);
		};

		this.showWithin = function () {
			selectService.showWithin(this.data.response.docs);
		};

		this.allShowing = function () {
			if (!this.data || !this.data.response) {
				return false;
			}
			return !this.data.response.docs.some(function (dataset) {
				return !dataset.showLayer;
			});
		};

		this.anyShowing = function () {
			if (!this.data || !this.data.response) {
				return false;
			}
			return this.data.response.docs.some(function (dataset) {
				return dataset.showLayer;
			});
		};

		this.hideAll = function () {
			selectService.hideAll(this.data.response.docs);
		};

		this.hilight = function (doc) {
			if (doc.layer) {
				selectService.hilight(doc.layer);
			}
		};

		this.lolight = function (doc) {
			if (doc.layer) {
				selectService.lolight(doc.layer);
			}
		};
	}
})(angular);
"use strict";

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {
	'use strict';

	angular.module("water.panes", []).directive("icsmPanes", ['$rootScope', '$timeout', 'mapService', function ($rootScope, $timeout, mapService) {
		return {
			templateUrl: "water/panes/panes.html",
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

					if ($scope.view == what) {
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
	}]).directive("icsmTabs", [function () {
		return {
			templateUrl: "water/panes/tabs.html",
			require: "^icsmPanes"
		};
	}]).controller("PaneCtrl", PaneCtrl).factory("paneService", PaneService);

	PaneCtrl.$inject = ["paneService"];
	function PaneCtrl(paneService) {
		paneService.data().then(function (data) {
			this.data = data;
		}.bind(this));
	}

	PaneService.$inject = [];
	function PaneService() {
		var data = {};

		return {
			add: function add(item) {},

			remove: function remove(item) {}
		};
	}
})(angular);
angular.module("water.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("water/select/doc.html","<div ng-class-odd=\"\'odd\'\" ng-class-even=\"\'even\'\" ng-mouseleave=\"select.lolight(doc)\" ng-mouseenter=\"select.hilight(doc)\">\r\n	<span ng-class=\"{ellipsis:!expanded}\" tooltip-enable=\"!expanded\" style=\"width:100%;display:inline-block;\"\r\n			tooltip-class=\"selectAbstractTooltip\" tooltip=\"{{doc.abstract | truncate : 250}}\" tooltip-placement=\"bottom\">\r\n		<button type=\"button\" class=\"undecorated\" ng-click=\"expanded = !expanded\" title=\"Click to see more about this dataset\">\r\n			<i class=\"fa pad-right fa-lg\" ng-class=\"{\'fa-caret-down\':expanded,\'fa-caret-right\':(!expanded)}\"></i>\r\n		</button>\r\n		<download-add item=\"doc\" group=\"group\"></download-add>\r\n		<common-wms data=\"doc\"></common-wms>\r\n		<common-bbox data=\"doc\" ng-if=\"doc.showExtent\"></common-bbox>\r\n		<common-cc4></common-cc4>\r\n		<a href=\"http://www.ga.gov.au/metadata-gateway/metadata/record/{{doc.sysId}}\" target=\"_blank\" ><strong>{{doc.title}}</strong></a>\r\n	</span>\r\n	<span ng-class=\"{ellipsis:!expanded}\" style=\"width:100%;display:inline-block;padding-right:15px;\">\r\n		{{doc.abstract}}\r\n	</span>\r\n	<div ng-show=\"expanded\" style=\"padding-bottom: 5px;\">\r\n		<h5>Keywords</h5>\r\n		<div>\r\n			<span class=\"badge\" ng-repeat=\"keyword in doc.keywords track by $index\">{{keyword}}</span>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("water/select/group.html","<div class=\"panel panel-default\" style=\"margin-bottom:-5px;\" >\r\n	<div class=\"panel-heading\"><nedf-wms data=\"group\"></nedf-wms> <strong>{{group.title}}</strong></div>\r\n	<div class=\"panel-body\">\r\n   		<div ng-repeat=\"doc in group.docs\">\r\n   			<div select-doc doc=\"doc\" group=\"group\"></div>\r\n		</div>\r\n	</div>\r\n</div>\r\n");
$templateCache.put("water/select/select.html","<div>\r\n	<div style=\"position:relative;padding:5px;padding-left:10px;\" ng-controller=\"SelectCtrl as select\" class=\"scrollPanel\">\r\n		<div class=\"panel panel-default\" style=\"margin-bottom:-5px\">\r\n  			<div class=\"panel-heading\">\r\n  				<h3 class=\"panel-title\">Available datasets</h3>\r\n  			</div>\r\n  			<div class=\"panel-body\">\r\n				<div ng-repeat=\"doc in select.data.response.docs\" style=\"padding-bottom:7px\">\r\n					<div select-doc ng-if=\"doc.type == \'dataset\'\" doc=\"doc\"></div>\r\n					<select-group ng-if=\"doc.type == \'group\'\" group=\"doc\"></select-group>\r\n				</div>\r\n  			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("water/panes/panes.html","<div class=\"container contentContainer\">\r\n	<div class=\"row icsmPanesRow\" >\r\n		<div class=\"icsmPanesCol\" ng-class=\"{\'col-md-12\':!view, \'col-md-7\':view}\" style=\"padding-right:0\">\r\n			<div class=\"expToolbar row noPrint\" icsm-toolbar-row map=\"root.map\"></div>\r\n			<div class=\"panesMapContainer\" geo-map configuration=\"data.map\">\r\n			    <geo-extent></geo-extent>\r\n			</div>\r\n    		<div geo-draw data=\"data.map.drawOptions\" line-event=\"elevation.plot.data\" rectangle-event=\"bounds.drawn\"></div>\r\n    		<div icsm-tabs class=\"icsmTabs\"  ng-class=\"{\'icsmTabsClosed\':!view, \'icsmTabsOpen\':view}\"></div>\r\n		</div>\r\n		<div class=\"icsmPanesColRight\" ng-class=\"{\'hidden\':!view, \'col-md-5\':view}\" style=\"padding-left:0; padding-right:0\">\r\n			<div class=\"panesTabContentItem\" ng-show=\"view == \'datasets\'\" water-select></div>\r\n			<div class=\"panesTabContentItem\" ng-show=\"view == \'glossary\'\" water-glossary></div>\r\n			<div class=\"panesTabContentItem\" ng-show=\"view == \'help\'\" water-help></div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("water/panes/tabs.html","<!-- tabs go here -->\r\n<div id=\"panesTabsContainer\" class=\"paneRotateTabs\" style=\"opacity:0.9\" ng-style=\"{\'right\' : contentLeft +\'px\'}\">\r\n\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'datasets\'}\" ng-click=\"setView(\'datasets\')\">\r\n		<button class=\"undecorated\">Datasets</button>\r\n	</div>\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'glossary\'}\" ng-click=\"setView(\'glossary\')\">\r\n		<button class=\"undecorated\">Glossary</button>\r\n	</div>\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'help\'}\" ng-click=\"setView(\'help\')\">\r\n		<button class=\"undecorated\">Help</button>\r\n	</div>\r\n</div>\r\n");}]);