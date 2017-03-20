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

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {

	'use strict';

	angular.module("icsm.bounds", []).directive('icsmBounds', ['flashService', 'messageService', 'boundsService', function (flashService, messageService, boundsService) {
		var flasher;
		return {
			restrict: 'AE',
			link: function link() {
				boundsService.init().then(null, null, function notify(message) {
					flashService.remove(flasher);
					switch (message.type) {
						case "error":
						case "warn":
						case "info":
							messageService[message.type](message.text);
							break;
						default:
							flashService.remove(flasher);
							flasher = flashService.add(message.text, message.duration ? message.duration : 8000, message.type === "wait");
					}
				});
			}
		};
	}]).factory("boundsService", ['$http', '$q', '$rootScope', '$timeout', 'configService', 'flashService', function ($http, $q, $rootScope, $timeout, configService, flashService) {
		var clipTimeout, notify;
		return {
			init: function init() {
				notify = $q.defer();
				$rootScope.$on('icsm.clip.drawn', function (event, clip) {
					send('Area drawn. Checking for data...');
					_checkSize(clip).then(function (message) {
						if (message.code === "success") {
							$rootScope.$broadcast('icsm.bounds.draw', [clip.xMin, clip.yMin, clip.xMax, clip.yMax]);
							getList(clip);
						} else {
							$rootScope.$broadcast('icsm.clip.draw', { message: "oversize" });
						}
					});
				});
				return notify.promise;
			},

			cancelDraw: function cancelDraw() {
				drawService.cancelDrawRectangle();
			},

			checkSize: function checkSize(clip) {
				return _checkSize(clip);
			}
		};

		function send(message, type, duration) {
			if (notify) {
				notify.notify({
					text: message,
					type: type,
					duration: duration
				});
			}
		}

		function _checkSize(clip) {
			var deferred = $q.defer();
			var result = drawn(clip);
			if (result && result.code) {
				switch (result.code) {
					case "oversize":
						$timeout(function () {
							send("", "clear");
							send("The selected area is too large to process. Please restrict to approximately " + "2 degrees square.", "error");
							deferred.resolve(result);
						});
						break;
					case "undersize":
						$timeout(function () {
							send("", "clear");
							send("X Min and Y Min should be smaller than X Max and Y Max, respectively. " + "Please update the drawn area.", "error");
							deferred.resolve(result);
						});
						break;
					default:
						return $q.when(result);
				}
			}
			return deferred.promise;
		}

		function underSizeLimit(clip) {
			var size = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);
			return size < 0.00000000001 || clip.xMax < clip.xMin;
		}

		function overSizeLimit(clip) {
			// Shouldn't need abs but it doesn't hurt.
			var size = Math.abs((clip.xMax - clip.xMin) * (clip.yMax - clip.yMin));
			return size > 4;
		}

		function forceNumbers(clip) {
			clip.xMax = clip.xMax === null ? null : +clip.xMax;
			clip.xMin = clip.xMin === null ? null : +clip.xMin;
			clip.yMax = clip.yMax === null ? null : +clip.yMax;
			clip.yMin = clip.yMin === null ? null : +clip.yMin;
		}

		function drawn(clip) {
			//geoprocessService.removeClip();
			forceNumbers(clip);

			if (overSizeLimit(clip)) {
				return { code: "oversize" };
			}

			if (underSizeLimit(clip)) {
				return { code: "undersize" };
			}

			if (clip.xMax === null) {
				return { code: "incomplete" };
			}

			if (validClip(clip)) {
				return { code: "success" };
			}
			return { code: "invalid" };
		}

		// The input validator takes care of order and min/max constraints. We just check valid existance.
		function validClip(clip) {
			return clip && angular.isNumber(clip.xMax) && angular.isNumber(clip.xMin) && angular.isNumber(clip.yMax) && angular.isNumber(clip.yMin) && !overSizeLimit(clip) && !underSizeLimit(clip);
		}

		function getList(clip) {
			configService.getConfig("processing").then(function (conf) {
				var url = conf.intersectsUrl;
				if (url) {
					// Order matches the $watch signature so be careful
					var urlWithParms = url.replace("{maxx}", clip.xMax).replace("{minx}", clip.xMin).replace("{maxy}", clip.yMax).replace("{miny}", clip.yMin);

					send("Checking there is data in your selected area...", "wait", 180000);
					$http.get(urlWithParms).then(function (response) {
						if (response.data && response.data.available_data) {
							var message = "There is no data held in your selected area. Please try another area.";
							send("", "clear");
							if (response.data.available_data) {
								response.data.available_data.forEach(function (group) {
									if (group.downloadables) {
										message = "There is intersecting data. Select downloads from the list.";
									}
								});
							}
							send(message, null, 4000);
							$rootScope.$broadcast('site.selection', response.data);
						}
					}, function (err) {
						// If it falls over we don't want to crash.
						send("The service that provides the list of datasets is currently unavailable. " + "Please try again later.", "error");
					});
				}
			});
		}
	}]);
})(angular);
'use strict';

(function (angular) {

	'use strict';

	angular.module("IcsmApp", ['common.altthemes', 'common.baselayer.control', 'common.cc', 'common.featureinfo', 'common.header', 'common.legend', 'common.navigation',
	//'common.panes',
	'common.storage', 'common.templates', 'common.toolbar', 'explorer.config', 'explorer.confirm', 'explorer.drag', 'explorer.enter', 'explorer.flasher', 'explorer.googleanalytics', 'explorer.httpdata', 'explorer.info', 'explorer.legend', 'explorer.message', 'explorer.modal', 'explorer.persist', 'explorer.projects', 'explorer.tabs', 'explorer.version', 'exp.ui.templates', 'explorer.map.templates', 'ui.bootstrap', 'ui.bootstrap-slider', 'ngAutocomplete', 'ngRoute', 'ngSanitize', 'page.footer',

	//'geo.baselayer.control',
	'geo.draw', 'geo.elevation', 'geo.geosearch', 'geo.map', 'geo.maphelper', 'geo.measure', 'icsm.bounds', 'icsm.contributors', 'icsm.clip', 'icsm.glossary', 'icsm.help', 'icsm.panes',
	// Alternate list
	'elvis.header', 'elvis.results', 'elvis.reviewing', 'icsm.mapevents', 'icsm.select', 'icsm.splash', 'icsm.state', 'icsm.layerswitch', 'icsm.templates', 'icsm.view'])

	// Set up all the service providers here.
	.config(['configServiceProvider', 'projectsServiceProvider', 'persistServiceProvider', 'versionServiceProvider', function (configServiceProvider, projectsServiceProvider, persistServiceProvider, versionServiceProvider) {
		configServiceProvider.location("icsm/resources/config/config.json");
		configServiceProvider.dynamicLocation("icsm/resources/config/appConfig.json?t=");
		versionServiceProvider.url("icsm/assets/package.json");
		projectsServiceProvider.setProject("icsm");
		persistServiceProvider.handler("local");
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
'use strict';

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {

	'use strict';

	angular.module("icsm.clip", ['geo.draw']).directive('icsmInfoBbox', function () {
		return {
			restrict: 'AE',
			templateUrl: 'icsm/clip/infobbox.html'
		};
	}).directive("icsmClip", ['$rootScope', '$timeout', 'clipService', 'messageService', 'mapService', function ($rootScope, $timeout, clipService, messageService, mapService) {
		return {
			templateUrl: "icsm/clip/clip.html",
			scope: {
				bounds: "=",
				trigger: "=",
				drawn: "&"
			},
			link: function link(scope, element) {
				var timer;

				scope.clip = {
					xMax: null,
					xMin: null,
					yMax: null,
					yMin: null
				};
				scope.typing = false;

				if (typeof scope.showBounds === "undefined") {
					scope.showBounds = false;
				}
				mapService.getMap().then(function (map) {
					scope.$watch("bounds", function (bounds) {
						if (bounds && scope.trigger) {
							$timeout(function () {
								scope.initiateDraw();
							});
						} else if (!bounds) {
							clipService.cancelDraw();
						}
					});
				});

				scope.check = function () {
					$timeout.cancel(timer);
					timer = $timeout(function () {
						$rootScope.$broadcast('icsm.clip.drawn', scope.clip);
					}, 4000);
				};

				$rootScope.$on('icsm.clip.draw', function (event, data) {
					if (data && data.message === "oversize") {
						scope.oversize = true;
						$timeout(function () {
							delete scope.oversize;
						}, 6000);
					} else {
						delete scope.oversize;
					}
					scope.initiateDraw();
				});

				scope.initiateDraw = function () {
					messageService.info("Click on the map and drag to define your area of interest.");
					clipService.initiateDraw().then(drawComplete);
				};

				function drawComplete(data) {
					var c = scope.clip;
					var response;

					c.xMax = +data.clip.xMax;
					c.xMin = +data.clip.xMin;
					c.yMax = +data.clip.yMax;
					c.yMin = +data.clip.yMin;
					$rootScope.$broadcast('icsm.clip.drawn', c);
				}
			}
		};
	}]).factory("clipService", ['$q', '$rootScope', 'drawService', function ($q, $rootScope, drawService) {
		var service = {
			initiateDraw: function initiateDraw() {
				this.data = null;
				return drawService.drawRectangle().then(drawComplete);
			},

			cancelDraw: function cancelDraw() {
				drawService.cancelDrawRectangle();
			}
		};

		return service;

		function drawComplete(data) {
			service.data = {
				clip: {
					xMax: data.bounds.getEast().toFixed(5),
					xMin: data.bounds.getWest().toFixed(5),
					yMax: data.bounds.getNorth().toFixed(5),
					yMin: data.bounds.getSouth().toFixed(5)
				}
			};
			return service.data;
		}
	}]);
})(angular);
"use strict";

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {

	'use strict';

	angular.module("icsm.glossary", []).directive("icsmGlossary", [function () {
		return {
			templateUrl: "icsm/glossary/glossary.html"
		};
	}]).controller("GlossaryCtrl", GlossaryCtrl).factory("glossaryService", GlossaryService);

	GlossaryCtrl.$inject = ['$log', 'glossaryService'];
	function GlossaryCtrl($log, glossaryService) {
		var self = this;
		$log.info("GlossaryCtrl");
		glossaryService.getTerms().then(function (terms) {
			self.terms = terms;
		});
	}

	GlossaryService.$inject = ['$http'];
	function GlossaryService($http) {
		var TERMS_SERVICE = "icsm/resources/config/glossary.json";

		return {
			getTerms: function getTerms() {
				return $http.get(TERMS_SERVICE, { cache: true }).then(function (response) {
					return response.data;
				});
			}
		};
	}
})(angular);
'use strict';

(function (angular) {
   'use strict';

   angular.module('icsm.contributors', []).directive("icsmContributors", ["$interval", "contributorsService", function ($interval, contributorsService) {
      return {
         templateUrl: "icsm/contributors/contributors.html",
         scope: {},
         link: function link(scope) {
            var timer = void 0;

            scope.contributors = contributorsService.getState();

            scope.over = function () {
               $interval.cancel(timer);
               scope.contributors.ingroup = true;
            };

            scope.out = function () {
               timer = $interval(function () {
                  scope.contributors.ingroup = false;
               }, 1000);
            };

            scope.unstick = function () {
               scope.contributors.ingroup = scope.contributors.show = scope.contributors.stick = false;
            };
         }
      };
   }]).directive("icsmContributorsLink", ["$interval", "contributorsService", function ($interval, contributorsService) {
      return {
         restrict: "AE",
         templateUrl: "icsm/contributors/show.html",
         scope: {},
         link: function link(scope) {
            var timer = void 0;
            scope.contributors = contributorsService.getState();
            scope.over = function () {
               $interval.cancel(timer);
               scope.contributors.show = true;
            };

            scope.toggleStick = function () {
               scope.contributors.stick = !scope.contributors.stick;
               if (!scope.contributors.stick) {
                  scope.contributors.show = scope.contributors.ingroup = false;
               }
            };

            scope.out = function () {
               timer = $interval(function () {
                  scope.contributors.show = false;
               }, 700);
            };
         }
      };
   }]).factory("contributorsService", ContributorsService).filter("activeContributors", function () {
      return function (contributors) {
         if (!contributors) {
            return [];
         }
         return contributors.filter(function (contributor) {
            return contributor.enabled;
         });
      };
   });

   ContributorsService.$inject = ["$http"];
   function ContributorsService($http) {
      var state = {
         show: false,
         ingroup: false,
         stick: false
      };

      $http.get("icsm/resources/config/contributors.json").then(function (response) {
         state.orgs = response.data;
      });

      return {
         getState: function getState() {
            return state;
         }
      };
   }
})(angular);
'use strict';

(function (angular) {

	'use strict';

	angular.module('elvis.header', []).controller('headerController', ['$scope', '$q', '$timeout', function ($scope, $q, $timeout) {

		var modifyConfigSource = function modifyConfigSource(headerConfig) {
			return headerConfig;
		};

		$scope.$on('headerUpdated', function (event, args) {
			$scope.headerConfig = modifyConfigSource(args);
		});
	}]).directive('elvisHeader', [function () {
		var defaults = {
			heading: "ICSM",
			headingtitle: "ICSM",
			helpurl: "help.html",
			helptitle: "Get help about ICSM",
			helpalttext: "Get help about ICSM",
			skiptocontenttitle: "Skip to content",
			skiptocontent: "Skip to content",
			quicklinksurl: "/search/api/quickLinks/json?lang=en-US"
		};
		return {
			transclude: true,
			restrict: 'EA',
			templateUrl: "icsm/header/header.html",
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
'use strict';

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular, L) {

   'use strict';

   angular.module("icsm.layerswitch", []).directive('icsmLayerswitch', ['$http', 'configService', 'mapService', function ($http, configService, mapService) {
      return {
         restrict: "AE",
         link: function link(scope) {
            var config;
            var latlngs;

            configService.getConfig("layerSwitch").then(function (response) {
               config = response;
               $http.get(config.extentUrl, { cache: true }).then(function (response) {
                  var container = L.geoJson(response.data);
                  var layer = container.getLayers()[0];
                  if (layer) {
                     latlngs = layer.getLatLngs();
                  }

                  mapService.getMap().then(function (map) {
                     map.on("moveend", checkExtent);
                     checkExtent();

                     function checkExtent(event) {
                        var bounds = map.getBounds();
                        if (insidePolygon({ lng: bounds.getWest(), lat: bounds.getSouth() }, latlngs) && // ll
                        insidePolygon({ lng: bounds.getWest(), lat: bounds.getNorth() }, latlngs) && // ul
                        insidePolygon({ lng: bounds.getEast(), lat: bounds.getSouth() }, latlngs) && // lr
                        insidePolygon({ lng: bounds.getEast(), lat: bounds.getNorth() }, latlngs) // ur
                        ) {
                              inSpace();
                           } else {
                           outOfSpace();
                        }
                     }

                     function outOfSpace() {
                        setLayers({
                           outside: true,
                           inside: false
                        });
                     }

                     function inSpace() {
                        setLayers({
                           outside: false,
                           inside: true
                        });
                     }

                     function setLayers(settings) {
                        map.eachLayer(function (layer) {
                           if (layer.options && layer.options.switch) {
                              if (layer.options.switch == config.inside) {
                                 layer._container.style.display = settings.inside ? "block" : "none";
                              }
                              if (layer.options.switch == config.outside) {
                                 layer._container.style.display = settings.outside ? "block" : "none";
                              }
                           }
                        });
                     }
                  });
               });
            });
         }
      };
   }]);

   function insidePolygon(latlng, polyPoints) {
      var x = latlng.lat,
          y = latlng.lng;

      var inside = false;
      for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
         var xi = polyPoints[i].lat,
             yi = polyPoints[i].lng;
         var xj = polyPoints[j].lat,
             yj = polyPoints[j].lng;

         var intersect = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
         if (intersect) inside = !inside;
      }

      return inside;
   }
})(angular, L);
"use strict";

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {

	'use strict';

	angular.module("icsm.help", []).directive("icsmHelp", [function () {
		return {
			templateUrl: "icsm/help/help.html"
		};
	}]).directive("icsmFaqs", [function () {
		return {
			restrict: "AE",
			templateUrl: "icsm/help/faqs.html",
			scope: {
				faqs: "="
			},
			link: function link(scope) {
				scope.focus = function (key) {
					$("#faqs_" + key).focus();
				};
			}
		};
	}]).controller("HelpCtrl", HelpCtrl).factory("helpService", HelpService);

	HelpCtrl.$inject = ['$log', 'helpService'];
	function HelpCtrl($log, helpService) {
		var self = this;
		$log.info("HelpCtrl");
		helpService.getFaqs().then(function (faqs) {
			self.faqs = faqs;
		});
	}

	HelpService.$inject = ['$http'];
	function HelpService($http) {
		var FAQS_SERVICE = "icsm/resources/config/faqs.json";

		return {
			getFaqs: function getFaqs() {
				return $http.get(FAQS_SERVICE, { cache: true }).then(function (response) {
					return response.data;
				});
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

	angular.module("icsm.panes", []).directive("icsmPanes", ['$rootScope', '$timeout', 'mapService', function ($rootScope, $timeout, mapService) {
		return {
			templateUrl: "icsm/panes/panes.html",
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
			templateUrl: "icsm/panes/tabs.html",
			require: "^icsmPanes"
		};
	}]).controller("PaneCtrl", PaneCtrl).factory("paneService", PaneService);

	PaneCtrl.$inject = ["paneService"];
	function PaneCtrl(paneService) {
		var _this = this;

		paneService.data().then(function (data) {
			_this.data = data;
		});
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
'use strict';

(function (mapevents) {
   'use strict';

   angular.module("icsm.mapevents", ['geo.map']).directive('icsmMapevents', ['icsmMapeventsService', function (icsmMapeventsService) {
      return {
         restrict: 'AE',
         link: function link(scope) {
            icsmMapeventsService.tickle();
         }
      };
   }]).factory('icsmMapeventsService', ['$rootScope', '$timeout', 'configService', 'mapService', function ($rootScope, $timeout, configService, mapService) {
      var marker, poly, bounds;
      var config = configService.getConfig("mapConfig");
      $rootScope.$on('icsm.bounds.draw', function showBbox(event, bbox) {
         // 149.090045383719,-35.4,149.4,-35.3
         if (!bbox) {
            makeBounds(null);
            return;
         }

         var xmax = bbox[2],
             xmin = bbox[0],
             ymax = bbox[3],
             ymin = bbox[1];

         // It's a bbox.
         makeBounds({
            type: "Feature",
            geometry: {
               type: "Polygon",
               coordinates: [[[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax], [xmin, ymin]]]
            },
            properties: {}
         }, false);
      });

      $rootScope.$on('icsm.bbox.draw', function showBbox(event, bbox) {
         // 149.090045383719,-35.4,149.4,-35.3
         if (!bbox) {
            makePoly(null);
            return;
         }

         var xmax = bbox[2],
             xmin = bbox[0],
             ymax = bbox[3],
             ymin = bbox[1];

         // It's a bbox.
         makePoly({
            type: "Feature",
            geometry: {
               type: "Polygon",
               coordinates: [[[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax], [xmin, ymin]]]
            },
            properties: {}
         }, false);
      });
      $rootScope.$on('icsm.poly.draw', function showBbox(event, geojson) {
         // It's a GeoJSON Polygon geometry and it has a single ring.
         makePoly(geojson, true);
      });

      if (config.listenForMarkerEvent) {
         $rootScope.$on(config.listenForMarkerEvent, function showBbox(event, geojson) {
            // It's a GeoJSON Polygon geometry and it has a single ring.
            makeMarker(geojson);
         });
      }

      function makeMarker(data) {
         mapService.getMap().then(function (map) {
            if (marker) {
               map.removeLayer(marker);
            }
            if (!data) {
               return;
            }

            var point;
            if (typeof data.properties.SAMPLE_LONGITUDE !== "undefined") {
               point = {
                  type: "Point",
                  coordinates: [data.properties.SAMPLE_LONGITUDE, data.properties.SAMPLE_LATITUDE]
               };
            } else {
               point = data.geometry;
            }

            marker = L.geoJson({
               type: "Feature",
               geometry: point,
               id: data.id
            }).addTo(map);

            if (data.properties.html) {
               marker.bindPopup(data.properties.html).openPopup();
            }
         });
      }

      function makePoly(data, zoomTo) {
         mapService.getMap().then(function (map) {
            if (poly) {
               map.removeLayer(poly);
            }

            if (data) {
               poly = L.geoJson(data, {
                  style: function style(feature) {
                     return {
                        opacity: 1,
                        clickable: false,
                        fillOpacity: 0,
                        color: "red"
                     };
                  }
               }).addTo(map);

               if (zoomTo) {
                  $timeout(function () {
                     var bounds = poly.getBounds();
                     map.fitBounds(bounds, {
                        animate: true,
                        padding: L.point(100, 100)
                     });
                  }, 50);
               }
            }
         });
      }

      function makeBounds(data, zoomTo) {
         mapService.getMap().then(function (map) {
            if (bounds) {
               map.removeLayer(bounds);
            }

            if (data) {
               bounds = L.geoJson(data, {
                  style: function style(feature) {
                     return {
                        opacity: 1,
                        clickable: false,
                        fillOpacity: 0,
                        color: "black"
                     };
                  }
               }).addTo(map);

               if (zoomTo) {
                  $timeout(function () {
                     var boundingBox = bounds.getBounds();
                     map.fitBounds(boundingBox, {
                        animate: true,
                        padding: L.point(100, 100)
                     });
                  }, 50);
               }
            }
         });
      }

      function clip(num, min, max) {
         return Math.min(Math.max(num, min), max);
      }

      return {
         tickle: function tickle() {
            mapService.getMap().then(function (map) {
               map.on('click', function (event) {
                  var zoom = map.getZoom();
                  var latlng = event.latlng;
                  $rootScope.$broadcast("zoom.to", {
                     zoom: zoom,
                     latlng: latlng
                  });
               });
            });
         }
      };
   }]);
})();
"use strict";

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {
	'use strict';

	angular.module("icsm.plot", []).directive("icsmPlot", ['$log', function ($log) {
		return {
			restrict: "AE",
			scope: {
				line: "="
			},
			link: function link(scope, element, attrs, ctrl) {
				scope.$watch("line", function (newValue, oldValue) {
					$log.info(newValue);
				});
			}
		};
	}]);
})(angular);
'use strict';

/*!
 * Copyright 2016 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {

   'use strict';

   angular.module("elvis.results.continue", []).directive('icsmSearchContinue', ['continueService', function (continueService) {
      return {
         templateUrl: 'icsm/results/continue.html',
         controller: 'listCtrl',
         controllerAs: 'ctrl',
         link: function link(scope, element) {
            scope.data = continueService.data;
         }
      };
   }]).factory('continueService', ['listService', function (listService) {
      var service = {};
      service.data = listService.data;
      return service;
   }]).filter("someSelected", function () {
      return function (products) {
         return products && products.some(function (item) {
            return item.selected;
         });
      };
   }).filter("countSelected", function () {
      return function (products) {
         return products ? products.filter(function (item) {
            return item.selected;
         }).length : '';
      };
   });
})(angular);
'use strict';

/*!
 * Copyright 2016 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {
    'use strict';

    angular.module("elvis.results", ['elvis.results.continue']).directive('icsmOrgHeading', [function () {
        return {
            templateUrl: 'icsm/results/orgheading.html',
            restrict: 'AE',
            scope: {
                org: "=",
                expansions: "=",
                mappings: "=",
                products: "="
            },
            link: function link(scope) {
                scope.orgHasSelections = function () {
                    var source = scope.org.source;
                    return scope.products.some(function (product) {
                        return product.source === source && product.selected;
                    });
                };

                scope.deselectAll = function () {
                    var source = scope.org.source;
                    scope.products.filter(function (product) {
                        return product.source === source && product.selected;
                    }).forEach(function (product) {
                        product.selected = false;
                    });
                };
            }
        };
    }]).directive('icsmList', ['$rootScope', 'listService', function ($rootScope, listService) {
        return {
            templateUrl: 'icsm/results/results.html',
            link: function link(scope) {
                listService.getMappings().then(function (response) {
                    scope.mappings = response;
                });

                scope.filters = listService.data;

                scope.update = function () {
                    var filterExists = !!scope.filters.filter;
                    var types = [];

                    var typesExists = scope.filters.types.some(function (type) {
                        return type.selected;
                    }) && !scope.filters.types.every(function (type) {
                        return type.selected;
                    });
                    // Set up the default
                    scope.products.forEach(function (product) {
                        product.matched = !filterExists;
                    });

                    // Do the types first
                    if (typesExists) {
                        scope.products.forEach(function (product) {
                            product.matched = false;
                            scope.filters.types.filter(function (type) {
                                return type.selected;
                            }).forEach(function (type) {
                                if (type.match && type.match[product.type]) {
                                    product.matched = true;
                                } else if (type.noMatch && !type.noMatch[product.type]) {
                                    product.matched = true;
                                }
                            });
                        });
                    }

                    // Now do the filters
                    if (filterExists) {
                        var upperFilter = scope.filters.filter.toUpperCase();
                        var products = scope.products;
                        if (typesExists) {
                            products = products.filter(function (item) {
                                return item.matched;
                            });
                        }

                        products.forEach(function (product) {
                            product.matched = product.file_name.toUpperCase().indexOf(upperFilter) > -1;
                        });
                    }
                };

                scope.show = function (data) {
                    var bbox = toNumberArray(data.bbox);
                    $rootScope.$broadcast('icsm.bbox.draw', bbox);
                };

                scope.hide = function (data) {
                    $rootScope.$broadcast('icsm.bbox.draw', null);
                };

                $rootScope.$on('site.selection', function (event, data) {
                    scope.list = null;
                    scope.products = [];
                    scope.productsMap = [];

                    if (data.available_data) {
                        scope.list = data.available_data.filter(function (org) {
                            return org.downloadables;
                        });

                        scope.list.forEach(function (org) {
                            angular.forEach(org.downloadables, function (types, type) {
                                angular.forEach(types, function (group, groupType) {
                                    group.forEach(function (product) {
                                        product.source = org.source;
                                        product.group = groupType;
                                        product.type = type;
                                        scope.productsMap[product.file_url] = product;
                                        scope.products.push(product);
                                    });
                                });
                            });
                        });
                        listService.products = scope.products;
                    }
                    scope.update();
                });

                scope.show = function (data) {
                    var bbox = toNumberArray(data.bbox);
                    $rootScope.$broadcast('icsm.bbox.draw', bbox);
                };

                scope.hide = function (data) {
                    $rootScope.$broadcast('icsm.bbox.draw', null);
                };

                function decorateCounts(list, types) {
                    // reset
                    var checks = [];
                    angular.forEach(types, function (type) {
                        type.count = 0;
                        checks.push(type);
                    });

                    if (list) {
                        list.forEach(function (item) {
                            item.downloadables.forEach(function (downloadable) {
                                checks.forEach(function (check) {
                                    check.count += downloadable[check.countField] ? 1 : 0;
                                });
                            });
                        });
                    }
                }

                function toNumberArray(numbs) {
                    if (angular.isArray(numbs) || !numbs) {
                        return numbs;
                    }
                    return numbs.split(/,\s*/g).map(function (numb) {
                        return +numb;
                    });
                }
            }
        };
    }]).directive('icsmAbstract', ['listService', function (listService) {
        return {
            templateUrl: "icsm/results/abstractbutton.html",
            scope: {
                item: "="
            },
            link: function link(scope) {
                scope.show = listService.hasMetadata(scope.item);

                scope.toggle = function () {
                    scope.item.showAbstract = !scope.item.showAbstract;
                    if (scope.item.showAbstract) {
                        load();
                    }
                };

                function load() {
                    if (!scope.fetched) {
                        scope.fetched = true;
                        listService.getMetadata(scope.item).then(function (data) {
                            scope.item.metadata = data;
                        });
                    }
                }
            }
        };
    }])

    // All this does is set up the data on mouse hover. The UI can do whatever it wants with the data when it arrives
    .directive('icsmAbstractHover', ['$timeout', 'listService', function ($timeout, listService) {
        var TIME_DELAY = 250; // ms
        return {
            restrict: 'AE',
            scope: {
                item: "="
            },
            link: function link(scope, element) {
                var promise;

                element.on('mouseenter', function () {
                    if (promise) {
                        $timeout.cancel(promise);
                    }
                    promise = $timeout(load, TIME_DELAY);
                });

                element.on('mouseleave', function () {
                    if (promise) {
                        $timeout.cancel(promise);
                        promise = null;
                    }
                });

                function load() {
                    if (!scope.fetched) {
                        scope.fetched = true;
                        listService.getMetadata(scope.item).then(function (data) {
                            scope.item.metadata = data;
                        });
                    }
                }
            }
        };
    }])

    // All this does is set up the data on mouse hover. The UI can do whatever it wants with the data when it arrives
    .directive('icsmAbstractLink', ['$timeout', 'listService', function ($timeout, listService) {

        return {
            restrict: 'AE',
            template: "<a target='_blank' ng-if='url' ng-href='{{url}}'>{{item.file_name}}</a><span ng-if='!url' ng-bind='item.file_name'></span>",
            scope: {
                item: "="
            },
            link: function link(scope, element) {
                scope.url = listService.getLink(scope.item);
            }
        };
    }]).controller('listCtrl', ListCtrl).factory('listService', ['$http', function ($http) {
        var service = {};
        var expansions = {};

        var strategies = new Strategies($http);

        service.data = {
            filter: "",
            types: []
        };

        $http.get('icsm/resources/config/filetypes.json').then(function (response) {
            service.data.typesMap = response.data;
            service.data.types = [];
            angular.forEach(response.data, function (value, key) {
                service.data.types.push(value);
            });
        });

        service.getMetadata = function (item) {
            return strategies.strategy(item.source).requestMetadata(item);
        };

        service.hasMetadata = function (item) {
            return strategies.strategy(item.source).hasMetadata(item);
        };

        service.getLink = function (item) {
            return strategies.strategy(item.source).constructLink(item);
        };

        service.getMappings = function () {
            return $http.get('icsm/resources/config/list.json').then(function (response) {
                return response.data;
            });
        };
        return service;
    }]).filter("allowedTypes", ['listService', function (listService) {
        return function (types) {
            if (!listService.data.types.some(function (type) {
                return type.selected;
            })) {
                return types;
            }
            var response = {};
            angular.forEach(types, function (item, key) {
                if (listService.data.typesMap && listService.data.typesMap[key] && listService.data.typesMap[key].selected) {
                    response[key] = item;
                }
            });
            return response;
        };
    }]).filter("countMatchedDownloadables", function () {
        return function (downloadables) {
            if (!downloadables) {
                return "-";
            } else {
                var count = 0;
                angular.forEach(downloadables, function (types, key) {
                    angular.forEach(types, function (items) {
                        count += items.filter(function (item) {
                            return item.matched;
                        }).length;
                    });
                });
                return count;
            }
        };
    }).filter("matchedTypes", function () {
        var data = listService.data;

        return function (obj) {
            var response = {};
            angular.forEach(obj, function (group, key) {
                if (group.some(function (item) {
                    return item.matched;
                })) {
                    response[key] = group;
                }
            });
            return response;
        };
    }).filter("matchedGroups", ['listService', function (listService) {
        return function (obj) {
            var response = {};
            if (obj) {
                angular.forEach(obj, function (group, key) {
                    if (group.some(function (item) {
                        return item.matched;
                    })) {
                        response[key] = group;
                    }
                });
            }
            return response;
        };
    }]).filter("matchedItems", ['listService', function (listService) {
        return function (list) {
            return list.filter(function (item) {
                return item.matched;
            });
        };
    }]).filter("countDownloadables", function () {
        return function (downloadables) {
            if (!downloadables) {
                return "-";
            } else {
                var count = 0;
                angular.forEach(downloadables, function (group, key) {
                    angular.forEach(group, function (value, key) {
                        count += value.length;
                    });
                });
                return count;
            }
        };
    }).filter('fileSize', function () {
        var meg = 1000 * 1000;
        var gig = meg * 1000;
        var ter = gig * 1000;

        return function (size) {
            if (!size) {
                return "-";
            }

            if (("" + size).indexOf(" ") > -1) {
                return size;
            }

            size = parseFloat(size);

            if (size < 1000) {
                return size + " bytes";
            }
            if (size < meg) {
                return (size / 1000).toFixed(1) + " kB";
            }
            if (size < gig) {
                return (size / meg).toFixed(1) + " MB";
            }
            if (size < ter) {
                return (size / gig).toFixed(1) + " GB";
            }
            return (size / ter).toFixed(1) + " TB";
        };
    });

    ListCtrl.$inject = ['listService'];
    function ListCtrl(listService) {
        this.service = listService;

        this.checkChildren = function (children) {
            var allChecked = this.childrenChecked(children);
            children.filter(function (child) {
                return child.matched;
            }).forEach(function (child) {
                if (allChecked) {
                    delete child.selected;
                } else {
                    child.selected = true;
                }
            });
        };

        this.childrenChecked = function (children) {
            return !children.filter(function (child) {
                return child.matched;
            }).some(function (child) {
                return !child.selected;
            });
        };

        this.someMatches = function (products) {
            var matches = false;
            angular.forEach(products.downloadables, function (group) {
                angular.forEach(group, function (subGroup) {
                    matches |= subGroup.some(function (item) {
                        return item.matched;
                    });
                });
            });
            return matches;
        };

        this.review = function () {
            this.service.data.reviewing = true;
        };

        this.cancelReview = function () {
            this.service.data.reviewing = false;
        };
    }

    ListCtrl.prototype = {
        get products() {
            return this.service.products;
        },

        get selectedSize() {
            var products = this.service.products;

            return (products ? products.filter(function (item) {
                return item.selected && !item.removed;
            }) : []).map(function (product) {
                return product.file_size ? +product.file_size : 500000000;
            }).reduce(function (prev, curr) {
                return prev + curr;
            }, 0);
        },

        get selected() {
            var products = this.service.products;
            return products ? products.filter(function (item) {
                return item.selected && !item.removed;
            }) : [];
        }
    };
})(angular);
'use strict';

/*!
 * Copyright 2016 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {

   'use strict';

   angular.module("elvis.reviewing", []).directive('icsmReview', ['$rootScope', '$uibModal', '$log', 'messageService', 'reviewService', function ($rootScope, $uibModal, $log, messageService, reviewService) {
      return {
         controller: ['$scope', function ($scope, reviewService) {}],
         link: function link(scope, element) {
            var modalInstance;
            scope.data = reviewService.data;

            scope.$watch("data.reviewing", function (value) {
               if (value) {
                  modalInstance = $uibModal.open({
                     templateUrl: 'icsm/reviewing/reviewing.html',
                     size: "lg",
                     backdrop: "static",
                     keyboard: false,
                     controller: ['$scope', '$uibModalInstance', 'products', function ($scope, $uibModalInstance, products) {
                        $scope.products = products;
                        $scope.accept = function () {
                           $uibModalInstance.close(true);
                        };

                        $scope.cancel = function () {
                           $uibModalInstance.close(false);
                        };

                        $scope.noneSelected = function (products) {
                           return !products.some(function (product) {
                              return product.selected;
                           });
                        };
                     }],
                     resolve: {
                        products: function products() {
                           return reviewService.products;
                        }
                     }
                  });
                  modalInstance.result.then(function (run) {
                     if (run) {
                        reviewService.startExtract().then(function (response) {
                           messageService[response.status](response.message);
                           reviewService.removeRemoved();
                           scope.data.reviewing = false;
                        });
                     }
                  }, function () {
                     $log.info('Cancelled');
                  });
               }
            });
         }
      };
   }]).directive("reviewEmail", ['reviewService', function (reviewService) {
      return {
         template: '<div class="input-group">' + '<span class="input-group-addon" id="nedf-email">Email</span>' + '<input required="required" type="email" ng-model="data.email" class="form-control" placeholder="Email address to send download link" aria-describedby="nedf-email">' + '</div>',
         restrict: "AE",
         link: function link(scope, element) {
            scope.data = reviewService.data;
            //console.log("data" + scope.data);
         }
      };
   }]).filter('reviewProductsSelected', function () {
      return function (products) {
         return products.filter(function (product) {
            return product.selected;
         });
      };
   }).factory('reviewService', ['$http', 'clipService', 'configService', 'listService', 'persistService', function ($http, clipService, configService, listService, persistService) {
      var key = "elvis_download_email";
      var data = listService.data;
      var service = {
         data: listService.data,
         get products() {
            return listService.products;
         },

         startExtract: function startExtract() {
            var clip = clipService.data.clip;
            this.setEmail(data.email);

            return configService.getConfig("processing").then(function (config) {
               var postData = convertFlatToStructured(listService.products.filter(function (product) {
                  return product.selected && !product.removed;
               }));
               postData.parameters = {
                  xmin: clip.xMin,
                  xmax: clip.xMax,
                  ymin: clip.yMin,
                  ymax: clip.yMax,
                  email: data.email
               };

               listService.products.forEach(function (product) {
                  product.selected = product.removed = false;
               });

               return $http({
                  method: 'POST',
                  url: config.postProcessingUrl,
                  data: postData,
                  headers: { "Content-Type": "application/json" }
               }).then(function (response) {
                  return {
                     status: "success",
                     message: "Your job has been submitted. An email will be sent on job completion."
                  };
               }, function (d) {
                  return {
                     status: "error",
                     message: "Sorry but the service failed to respond. Try again later."
                  };
               });
            });
         },

         removeRemoved: function removeRemoved() {
            listService.products.forEach(function (product) {
               product.removed = false;
            });
         },

         setEmail: function setEmail(email) {
            this.data.email = email;
            persistService.setItem(key, email);
         }
      };

      persistService.getItem(key).then(function (value) {
         service.data.email = value;
      });

      return service;
   }]);

   function transformTemplate(template, data) {
      var response = template;
      angular.forEach(data, function (value, key) {
         response = response.replace("{" + key + "}", encodeURIComponent(value));
      });
      return response;
   }

   function convertFlatToStructured(flat) {
      var fields = ["file_url", "file_name", "file_size", "bbox"]; // ["index_poly_name", "file_name", "file_url", "file_size", "file_last_modified", "bbox"]
      var response = {
         available_data: []
      };
      var available = response.available_data;
      var sourceMap = {};

      flat.forEach(function (dataset) {
         var item = {};
         fields.forEach(function (field) {
            if (typeof dataset[field] !== "undefined") {
               item[field] = dataset[field];
            }
         });

         var data = sourceMap[dataset.source];
         if (!data) {
            data = {
               source: dataset.source,
               downloadables: {}
            };
            sourceMap[dataset.source] = data;
            available.push(data);
         }

         var downloadable = data.downloadables[dataset.type];
         if (!downloadable) {
            downloadable = {};
            data.downloadables[dataset.type] = downloadable;
         }

         var group = downloadable[dataset.group];
         if (!group) {
            group = [];
            downloadable[dataset.group] = group;
         }

         group.push(item);
      });

      return response;
   }
})(angular);
'use strict';

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */
(function (angular) {

	'use strict';

	angular.module("icsm.splash", []).directive('icsmSplash', ['$rootScope', '$uibModal', '$log', 'splashService', function ($rootScope, $uibModal, $log, splashService) {
		return {
			controller: ['$scope', 'splashService', function ($scope, splashService) {
				$scope.acceptedTerms = true;

				splashService.getReleaseNotes().then(function (messages) {
					$scope.releaseMessages = messages;
					$scope.acceptedTerms = splashService.hasViewedSplash();
				});
			}],
			link: function link(scope, element) {
				var modalInstance;

				scope.$watch("acceptedTerms", function (value) {
					if (value === false) {
						modalInstance = $uibModal.open({
							templateUrl: 'icsm/splash/splash.html',
							size: "lg",
							backdrop: "static",
							keyboard: false,
							controller: ['$scope', '$uibModalInstance', 'acceptedTerms', 'messages', function ($scope, $uibModalInstance, acceptedTerms, messages) {
								$scope.acceptedTerms = acceptedTerms;
								$scope.messages = messages;
								$scope.accept = function () {
									$uibModalInstance.close(true);
								};
							}],
							resolve: {
								acceptedTerms: function acceptedTerms() {
									return scope.acceptedTerms;
								},
								messages: function messages() {
									return scope.releaseMessages;
								}
							}
						});
						modalInstance.result.then(function (acceptedTerms) {
							$log.info("Accepted terms");
							scope.acceptedTerms = acceptedTerms;
							splashService.setHasViewedSplash(acceptedTerms);
						}, function () {
							$log.info('Modal dismissed at: ' + new Date());
						});
					}
				});

				$rootScope.$on("logoutRequest", function () {
					userService.setAcceptedTerms(false);
				});
			}
		};
	}]).factory("splashService", ['$http', function ($http) {
		var VIEWED_SPLASH_KEY = "icsm.accepted.terms",
		    releaseNotesUrl = "icsm/resources/service/releaseNotes";

		return {
			getReleaseNotes: function getReleaseNotes() {
				return $http({
					method: "GET",
					url: releaseNotesUrl + "?t=" + Date.now()
				}).then(function (result) {
					return result.data;
				});
			},
			hasViewedSplash: hasViewedSplash,
			setHasViewedSplash: setHasViewedSplash
		};

		function setHasViewedSplash(value) {
			if (value) {
				sessionStorage.setItem(VIEWED_SPLASH_KEY, true);
			} else {
				sessionStorage.removeItem(VIEWED_SPLASH_KEY);
			}
		}

		function hasViewedSplash() {
			return !!sessionStorage.getItem(VIEWED_SPLASH_KEY);
		}
	}]).filter("priorityColor", [function () {
		var map = {
			IMPORTANT: "red",
			HIGH: "blue",
			MEDIUM: "orange",
			LOW: "gray"
		};

		return function (priority) {
			if (priority in map) {
				return map[priority];
			}
			return "black";
		};
	}]).filter("wordLowerCamel", function () {
		return function (priority) {
			return priority.charAt(0) + priority.substr(1).toLowerCase();
		};
	}).filter("sortNotes", [function () {
		return function (messages) {
			if (!messages) {
				return;
			}
			var response = messages.slice(0).sort(function (prev, next) {
				if (prev.priority == next.priority) {
					return prev.lastUpdate == next.lastUpdate ? 0 : next.lastUpdate - prev.lastUpdate;
				} else {
					return prev.priority == "IMPORTANT" ? -11 : 1;
				}
			});
			return response;
		};
	}]);
})(angular);
"use strict";

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {

	'use strict';

	angular.module("icsm.select.service", []).factory("selectService", SelectService);

	SelectService.$inject = ['$http', '$q', '$rootScope', '$timeout', 'mapService', 'configService'];
	function SelectService($http, $q, $rootScope, $timeout, mapService, configService) {
		var LAYER_GROUP_KEY = "Search Layers",
		    baseUrl = "icsm/resources/config/select.json",
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

	angular.module("icsm.select", ['icsm.select.service']).controller("SelectCtrl", SelectCtrl).controller("SelectCriteriaCtrl", SelectCriteriaCtrl).directive("icsmSelect", [function () {
		return {
			templateUrl: "icsm/select/select.html",
			link: function link(scope, element, attrs) {
				//console.log("Hello select!");
			}
		};
	}]).directive("selectDoc", [function () {
		return {
			templateUrl: "icsm/select/doc.html",
			link: function link(scope, element, attrs) {
				//console.log("What's up doc!");
			}
		};
	}]).directive("selectGroup", [function () {
		return {
			templateUrl: "icsm/select/group.html",
			scope: {
				group: "="
			},
			link: function link(scope, element, attrs) {
				//console.log("What's up doc!");
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
'use strict';

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {

	'use strict';

	angular.module('icsm.state', []).directive("icsmStateToggle", ['downloadService', function (downloadService) {
		return {
			restrict: 'AE',
			template: '<button ng-click="toggle(false)" ng-disabled="state.show" class="btn btn-default" title="Start downlaod selection."><i class="fa fa-lg fa-object-group"></i></button>',
			link: function link(scope) {
				downloadService.data().then(function (data) {
					scope.state = data;
				});

				scope.toggle = function () {
					scope.state.show = !scope.state.show;
				};
			}
		};
	}]);
})(angular);
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BaseStrategy = function () {
   function BaseStrategy($http) {
      _classCallCheck(this, BaseStrategy);

      this.http = $http;
      this.NO_METADATA = "No metadata found for this dataset.";
   }

   _createClass(BaseStrategy, [{
      key: "constructLink",
      value: function constructLink(item) {
         return null;
      }
   }, {
      key: "hasMetadata",
      value: function hasMetadata(item) {
         return false;
      }
   }, {
      key: "requestMetadata",
      value: function requestMetadata(item) {
         return BaseStrategy.resolvedPromise({
            title: this.NO_METADATA
         });
      }
   }], [{
      key: "resolvedPromise",
      value: function resolvedPromise(data) {
         // Create a very poor man's promise for IE11 or anybody really. It'll work anywhere.
         var response = {
            then: function then(fn) {
               this.fn = fn;
            }
         };

         setTimeout(function () {
            if (response.fn) {
               response.fn(data);
            }
         }, 1);

         return response;
      }
   }, {
      key: "extractData",
      value: function extractData(wrapper) {
         var metadata = wrapper.MD_Metadata;
         var data = {};

         var node = metadata && metadata.identificationInfo && metadata.identificationInfo.MD_DataIdentification;
         var abstractNode = node;

         node = node && node.citation && node.citation.CI_Citation;
         node = node && node.title && node.title.CharacterString;

         if (node) {
            data.title = node.__text;

            var abstract = abstractNode && abstractNode.abstract && abstractNode.abstract.CharacterString && abstractNode.abstract.CharacterString.__text;
            data.abstract = data.abstractText = abstract;
         } else {
            data.title = _get(BaseStrategy.__proto__ || Object.getPrototypeOf(BaseStrategy), "NO_METADATA", this);
         }
         return data;
      }
   }]);

   return BaseStrategy;
}();

var UnknownStrategy = function (_BaseStrategy) {
   _inherits(UnknownStrategy, _BaseStrategy);

   function UnknownStrategy(http) {
      _classCallCheck(this, UnknownStrategy);

      return _possibleConstructorReturn(this, (UnknownStrategy.__proto__ || Object.getPrototypeOf(UnknownStrategy)).call(this, http));
   }

   return UnknownStrategy;
}(BaseStrategy);

var ActStrategy = function (_BaseStrategy2) {
   _inherits(ActStrategy, _BaseStrategy2);

   function ActStrategy(http) {
      _classCallCheck(this, ActStrategy);

      return _possibleConstructorReturn(this, (ActStrategy.__proto__ || Object.getPrototypeOf(ActStrategy)).call(this, http));
   }

   return ActStrategy;
}(BaseStrategy);

var GaStrategy = function (_BaseStrategy3) {
   _inherits(GaStrategy, _BaseStrategy3);

   function GaStrategy(http) {
      _classCallCheck(this, GaStrategy);

      var _this3 = _possibleConstructorReturn(this, (GaStrategy.__proto__ || Object.getPrototypeOf(GaStrategy)).call(this, http));

      _this3.GA_METADATA_TEMPLATE = 'http://www.ga.gov.au/metadata-gateway/metadata/record/gcat_${uuid}';
      _this3.UUID_REG_EX = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;
      return _this3;
   }

   _createClass(GaStrategy, [{
      key: "constructLink",
      value: function constructLink(item) {
         var uuid = item.metadata_id;
         return uuid ? this.GA_METADATA_TEMPLATE.replace("${uuid}", uuid) : null;
      }
   }, {
      key: "hasMetadata",
      value: function hasMetadata(item) {
         return !!this.constructLink(item);
      }
   }, {
      key: "requestMetadata",
      value: function requestMetadata(item) {
         var _this4 = this;

         var uuid = item.metadata_id;
         var url = uuid ? "xml2js/" + this.GA_METADATA_TEMPLATE.replace("${uuid}", uuid) + "/xml" : null;
         if (url) {
            return this.http.get(url).then(function (response) {
               return BaseStrategy.extractData(response.data.GetRecordByIdResponse);
            }, function (err) {
               return {
                  title: _this4.NO_METADATA
               };
            });
         } else {
            return BaseStrategy.resolvedPromise({
               title: this.NO_METADATA
            });
         }
      }
   }]);

   return GaStrategy;
}(BaseStrategy);

var NswStrategy = function (_BaseStrategy4) {
   _inherits(NswStrategy, _BaseStrategy4);

   function NswStrategy(http) {
      _classCallCheck(this, NswStrategy);

      var _this5 = _possibleConstructorReturn(this, (NswStrategy.__proto__ || Object.getPrototypeOf(NswStrategy)).call(this, http));

      _this5.NSW_METADATA_TEMPLATE = "https://s3-ap-southeast-2.amazonaws.com/nsw.elvis/z5${zone}/Metadata/";
      return _this5;
   }

   _createClass(NswStrategy, [{
      key: "constructLink",
      value: function constructLink(item) {
         var filename = item.file_name;
         var re = /\_5\d\_/;
         var index = filename.search(re);
         var zone = 6;
         var url = this.NSW_METADATA_TEMPLATE;
         if (index !== -1) {
            zone = filename.substr(index + 2, 1);
         }
         return url.replace("${zone}", zone) + filename.replace(".zip", "_Metadata.html");
      }
   }, {
      key: "hasMetadata",
      value: function hasMetadata(item) {
         return true;
      }
   }, {
      key: "requestMetadata",
      value: function requestMetadata(item) {
         var _this6 = this;

         var filename = item.file_name;
         var re = /\_5\d\_/;
         var index = filename.search(re);
         var zone = 6;
         var url = this.NSW_METADATA_TEMPLATE;
         if (index !== -1) {
            zone = filename.substr(index + 2, 1);
         }
         url = "xml2js/" + url.replace("${zone}", zone) + filename.replace(".zip", "_Metadata.xml");

         return this.http.get(url).then(function (response) {
            return BaseStrategy.extractData(response.data);
         }, function (err) {
            return {
               title: _get(NswStrategy.prototype.__proto__ || Object.getPrototypeOf(NswStrategy.prototype), "NO_METADATA", _this6)
            };
         });
      }
   }]);

   return NswStrategy;
}(BaseStrategy);

var NtStrategy = function (_BaseStrategy5) {
   _inherits(NtStrategy, _BaseStrategy5);

   function NtStrategy(http) {
      _classCallCheck(this, NtStrategy);

      return _possibleConstructorReturn(this, (NtStrategy.__proto__ || Object.getPrototypeOf(NtStrategy)).call(this, http));
   }

   return NtStrategy;
}(BaseStrategy);

var QldStrategy = function (_BaseStrategy6) {
   _inherits(QldStrategy, _BaseStrategy6);

   function QldStrategy(http) {
      _classCallCheck(this, QldStrategy);

      var _this8 = _possibleConstructorReturn(this, (QldStrategy.__proto__ || Object.getPrototypeOf(QldStrategy)).call(this, http));

      _this8.QLD_METADATA_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/rest/document?id={EB442CAB-D714-40D8-82C2-A01CA4661324}&f=xml";
      _this8.QLD_HTML_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/custom/detail.page?fid={EB442CAB-D714-40D8-82C2-A01CA4661324}";
      return _this8;
   }

   _createClass(QldStrategy, [{
      key: "constructLink",
      value: function constructLink(item) {
         var filename = item.file_name;
         var re = /\_5\d\_/;
         var index = filename.search(re);
         var zone = 6;
         var url = this.QLD_HTML_TEMPLATE;
         if (index !== -1) {
            zone = filename.substr(index + 2, 1);
         }
         return url.replace("${zone}", zone);
      }
   }, {
      key: "hasMetadata",
      value: function hasMetadata(item) {
         return true;
      }
   }, {
      key: "requestMetadata",
      value: function requestMetadata(item) {
         var _this9 = this;

         var filename = item.file_name;
         var re = /\_5\d\_/;
         var index = filename.search(re);
         var zone = 6;
         var url = this.QLD_METADATA_TEMPLATE;
         if (index !== -1) {
            zone = filename.substr(index + 2, 1);
         }
         url = "xml2js/" + url.replace("${zone}", zone);

         return this.http.get(url).then(function (response) {
            return BaseStrategy.extractData(response.data);
         }, function (err) {
            return {
               title: _get(QldStrategy.prototype.__proto__ || Object.getPrototypeOf(QldStrategy.prototype), "NO_METADATA", _this9)
            };
         });
      }
   }]);

   return QldStrategy;
}(BaseStrategy);

var SaStrategy = function (_BaseStrategy7) {
   _inherits(SaStrategy, _BaseStrategy7);

   function SaStrategy(http) {
      _classCallCheck(this, SaStrategy);

      return _possibleConstructorReturn(this, (SaStrategy.__proto__ || Object.getPrototypeOf(SaStrategy)).call(this, http));
   }

   return SaStrategy;
}(BaseStrategy);

var TasStrategy = function (_BaseStrategy8) {
   _inherits(TasStrategy, _BaseStrategy8);

   function TasStrategy(http) {
      _classCallCheck(this, TasStrategy);

      return _possibleConstructorReturn(this, (TasStrategy.__proto__ || Object.getPrototypeOf(TasStrategy)).call(this, http));
   }

   return TasStrategy;
}(BaseStrategy);

var VicStrategy = function (_BaseStrategy9) {
   _inherits(VicStrategy, _BaseStrategy9);

   function VicStrategy(http) {
      _classCallCheck(this, VicStrategy);

      return _possibleConstructorReturn(this, (VicStrategy.__proto__ || Object.getPrototypeOf(VicStrategy)).call(this, http));
   }

   return VicStrategy;
}(BaseStrategy);

var WaStrategy = function (_BaseStrategy10) {
   _inherits(WaStrategy, _BaseStrategy10);

   function WaStrategy(http) {
      _classCallCheck(this, WaStrategy);

      return _possibleConstructorReturn(this, (WaStrategy.__proto__ || Object.getPrototypeOf(WaStrategy)).call(this, http));
   }

   return WaStrategy;
}(BaseStrategy);

var Strategies = function () {
   function Strategies(http) {
      _classCallCheck(this, Strategies);

      var unknown = this.unknown = new UnknownStrategy();

      this.strategies = {
         "NSW Government": new NswStrategy(http),
         "VIC Government": unknown, // new VicStrategy(http),
         "SA Government": unknown, // new SaStrategy(http),
         "WA Government": unknown, // new WaStrategy(http),
         "QLD Government": new QldStrategy(http),
         "ACT Government": unknown, // new ActStrategy(http),
         "NT Government": unknown, // new NtStrategy(http),
         "TAS Government": unknown, // new TasStrategy(http),
         "Geoscience Australia": new GaStrategy(http)
      };
   }

   _createClass(Strategies, [{
      key: "strategy",
      value: function strategy(name) {
         var strategy = this.strategies[name];
         return strategy ? strategy : this.unknown;
      }
   }]);

   return Strategies;
}();
'use strict';

(function (angular) {

	'use strict';

	angular.module('icsm.themes', [])

	/**
 	 *
 	 * Override the original mars user.
 	 *
  	 */
	.directive('icsmThemes', ['themesService', function (themesService) {
		return {
			restrict: 'AE',
			templateUrl: 'icsm/themes/themes.html',
			link: function link(scope) {
				themesService.getThemes().then(function (themes) {
					scope.themes = themes;
				});

				themesService.getCurrentTheme().then(function (theme) {
					scope.theme = theme;
				});

				scope.changeTheme = function (theme) {
					scope.theme = theme;
					themesService.setTheme(theme.key);
				};
			}
		};
	}]).controller('themesCtrl', ['themesService', function (themesService) {
		this.service = themesService;
	}]).filter('themesFilter', function () {
		return function (features, theme) {
			var response = [];
			// Give 'em all if they haven't set a theme.
			if (!theme) {
				return features;
			}

			if (features) {
				features.forEach(function (feature) {
					if (feature.themes) {
						if (feature.themes.some(function (name) {
							return name == theme.key;
						})) {
							response.push(feature);
						}
					}
				});
			}
			return response;
		};
	}).factory('themesService', ['$q', 'configService', 'storageService', function ($q, configService, storageService) {
		var THEME_PERSIST_KEY = 'icsm.current.theme';
		var DEFAULT_THEME = "All";
		var waiting = [];
		var self = this;

		this.themes = [];
		this.theme = null;

		storageService.getItem(THEME_PERSIST_KEY).then(function (value) {
			if (!value) {
				value = DEFAULT_THEME;
			}
			configService.getConfig('themes').then(function (themes) {
				self.themes = themes;
				self.theme = themes[value];
				// Decorate the key
				angular.forEach(themes, function (theme, key) {
					theme.key = key;
				});
				waiting.forEach(function (wait) {
					wait.resolve(self.theme);
				});
			});
		});

		this.getCurrentTheme = function () {
			if (this.theme) {
				return $q.when(self.theme);
			} else {
				var waiter = $q.defer();
				waiting.push(waiter);
				return waiter.promise;
			}
		};

		this.getThemes = function () {
			return configService.getConfig('themes');
		};

		this.setTheme = function (key) {
			this.theme = this.themes[key];
			storageService.setItem(THEME_PERSIST_KEY, key);
		};

		return this;
	}]);
})(angular);
"use strict";

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {

	'use strict';

	angular.module("icsm.toolbar", []).directive("icsmToolbar", [function () {
		return {
			controller: 'toolbarLinksCtrl'
		};
	}])

	/**
  * Override the default mars tool bar row so that a different implementation of the toolbar can be used.
  */
	.directive('icsmToolbarRow', [function () {
		return {
			scope: {
				map: "="
			},
			restrict: 'AE',
			templateUrl: 'icsm/toolbar/toolbar.html'
		};
	}]).directive('icsmToolbarInfo', [function () {
		return {
			templateUrl: 'radwaste/toolbar/toolbarInfo.html'
		};
	}]).controller("toolbarLinksCtrl", ["$scope", "configService", function ($scope, configService) {

		var self = this;
		configService.getConfig().then(function (config) {
			self.links = config.toolbarLinks;
		});

		$scope.item = "";
		$scope.toggleItem = function (item) {
			$scope.item = $scope.item === item ? "" : item;
		};
	}]);
})(angular);
"use strict";

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular, $) {
	'use strict';

	angular.module("icsm.view", []).directive("icsmView", ['downloadService', function (downloadService) {
		return {
			templateUrl: "icsm/view/view.html",
			controller: "DownloadCtrl",
			link: function link(scope, element) {
				downloadService.data().then(function (data) {
					scope.data = data;
				});

				scope.$watch("data.item", function (item, old) {
					if (item || old) {
						downloadService.setState(item);
					}
				});
			}
		};
	}]).controller("DownloadCtrl", DownloadCtrl).factory("downloadService", DownloadService);

	DownloadCtrl.$inject = ["downloadService"];
	function DownloadCtrl(downloadService) {
		downloadService.data().then(function (data) {
			this.data = data;
		}.bind(this));

		this.remove = function () {
			downloadService.clear();
		};

		this.changeEmail = function (email) {
			downloadService.setEmail(email);
		};
	}

	DownloadService.$inject = ['$http', '$q', '$rootScope', 'mapService', 'storageService'];
	function DownloadService($http, $q, $rootScope, mapService, storageService) {
		var key = "download_email",
		    downloadLayerGroup = "Download Layers",
		    mapState = {
			zoom: null,
			center: null,
			layer: null
		},
		    _data = null,
		    service = {
			getLayerGroup: function getLayerGroup() {
				return mapService.getGroup(downloadLayerGroup);
			},

			setState: function setState(data) {
				if (data) {
					prepare();
				} else {
					restore();
				}

				function prepare() {

					var bounds = [[data.bounds.yMin, data.bounds.xMin], [data.bounds.yMax, data.bounds.xMax]];

					if (mapState.layer) {
						mapService.getGroup(downloadLayerGroup).removeLayer(mapState.layer);
					}
				}
				function restore(map) {
					if (mapState.layer) {
						mapService.clearGroup(downloadLayerGroup);
						mapState.layer = null;
					}
				}
			},

			decorate: function decorate() {
				var item = _data.item;
				_data.item.download = true;
				if (!item.processsing) {
					item.processing = {
						clip: {
							xMax: null,
							xMin: null,
							yMax: null,
							yMin: null
						}
					};
				}
			},

			setEmail: function setEmail(email) {
				storageService.setItem(key, email);
			},

			getEmail: function getEmail() {
				return storageService.getItem(key).then(function (value) {
					_data.email = value;
					return value;
				});
			},

			data: function data() {
				if (_data) {
					return $q.when(_data);
				}

				return $http.get('icsm/resources/config/icsm.json').then(function (response) {
					_data = response.data;
					service.decorate();
					return _data;
				});
			}
		};

		return service;
	}
})(angular, $);
angular.module("icsm.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("icsm/app/app.html","<div>\r\n	<!-- BEGIN: Sticky Header -->\r\n	<div explorer-header style=\"z-index:1\"\r\n			class=\"navbar navbar-default navbar-fixed-top\"\r\n			heading=\"\'Elevation\'\"\r\n			headingtitle=\"\'ICSM\'\"\r\n			breadcrumbs=\"[{name:\'ICSM\', title: \'Reload Elevation\', url: \'.\'}]\"\r\n			helptitle=\"\'Get help about Elevation\'\"\r\n			helpalttext=\"\'Get help about Elevation\'\">\r\n	</div>\r\n	<!-- END: Sticky Header -->\r\n\r\n	<!-- Messages go here. They are fixed to the tab bar. -->\r\n	<div explorer-messages class=\"marsMessages noPrint\"></div>\r\n	<icsm-panes data=\"root.data\" default-item=\"download\"></icsm-panes>\r\n</div>");
$templateCache.put("icsm/clip/clip.html","<div class=\"well well-sm\" style=\"margin-bottom:5px\">\r\n	<div class=\"container-fluid\">\r\n		<div class=\"row\">\r\n			<div class=\"col-md-12\" style=\"padding:0\">\r\n				<div class=\"\" role=\"group\" aria-label=\"...\">\r\n					<button ng-click=\"initiateDraw()\" ng-disable=\"client.drawing\"\r\n                      tooltip-append-to-body=\"true\" tooltip-placement=\"bottom\" uib-tooltip=\"Enable drawing of a bounding box. On enabling, click on the map and drag diagonally\"\r\n						class=\"btn btn-primary btn-default\">Select an area...</button>\r\n					<button ng-click=\"showInfo = !showInfo\" tooltip-placement=\"bottom\" uib-tooltip=\"Information.\" style=\"float:right\" class=\"btn btn-primary btn-default\"><i class=\"fa fa-info\"></i></button>\r\n				</div>\r\n				<exp-info title=\"Selecting an area\" show-close=\"true\" style=\"width:450px;position:fixed;top:200px;right:40px\" is-open=\"showInfo\">\r\n					<icsm-info-bbox></icsm-info-bbox>\r\n				</exp-info>\r\n			</div>\r\n		</div>\r\n\r\n		<div ng-show=\"oversize\" style=\"margin-top:6px\">\r\n			<div class=\"alert alert-danger\" style=\"padding:2px; margin-bottom:0px\" role=\"alert\">Please restrict the size of your selected area to no more than 4 square degrees.</div>\r\n		</div>\r\n\r\n		<div class=\"row\" ng-hide=\"(!clip.xMin && clip.xMin != 0) || oversize\" style=\"padding-top:7px;\">\r\n			<div class=\"col-md-12\">\r\n				Selected bounds: {{clip.xMin|number : 4}}&deg; west, {{clip.yMax|number : 4}}&deg; north, {{clip.xMax|number : 4}}&deg; east, {{clip.yMin|number\r\n				: 4}}&deg; south\r\n			</div>\r\n		</div>\r\n	</div>\r\n	<div class=\"container-fluid\" style=\"padding-top:7px\" ng-show=\"typing\">\r\n		<div class=\"row\">\r\n			<div class=\"col-md-3\"> </div>\r\n			<div class=\"col-md-8\">\r\n				<div style=\"font-weight:bold;width:3.5em;display:inline-block\">Y Max:</div>\r\n				<span>\r\n               <input type=\"text\" style=\"width:6em\" ng-model=\"clip.yMax\" ng-change=\"check()\"></input>\r\n               <span ng-show=\"showBounds && bounds\">({{bounds.yMax|number : 4}} max)</span>\r\n				</span>\r\n			</div>\r\n		</div>\r\n		<div class=\"row\">\r\n			<div class=\"col-md-6\">\r\n				<div style=\"font-weight:bold;width:3.5em;display:inline-block\">X Min:</div>\r\n				<span>\r\n               <input type=\"text\" style=\"width:6em\" ng-model=\"clip.xMin\" ng-change=\"check()\"></input>\r\n               <span ng-show=\"showBounds && bounds\">({{bounds.xMin|number : 4}} min)</span>\r\n				</span>\r\n			</div>\r\n			<div class=\"col-md-6\">\r\n				<div style=\"font-weight:bold;width:3.5em;display:inline-block\">X Max:</div>\r\n				<span>\r\n               <input type=\"text\" style=\"width:6em\" ng-model=\"clip.xMax\" ng-change=\"check()\"></input>\r\n               <span ng-show=\"showBounds && bounds\">({{bounds.xMax|number : 4}} max)</span>\r\n				</span>\r\n			</div>\r\n		</div>\r\n		<div class=\"row\">\r\n			<div class=\"col-md-offset-3 col-md-8\">\r\n				<div style=\"font-weight:bold;width:3.5em;display:inline-block\">Y Min:</div>\r\n				<span>\r\n               <input type=\"text\" style=\"width:6em\" ng-model=\"clip.yMin\" ng-change=\"check()\"></input>\r\n               <span ng-show=\"showBounds && bounds\">({{bounds.yMin|number : 4}} min)</span>\r\n				</span>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/clip/infobbox.html","<div class=\"\">\r\n	<strong style=\"font-size:120%\">Select an area of interest.</strong>\r\n   By hitting the \"Select an area...\" button an area on the map can be selected with the mouse by clicking a\r\n   corner and while holding the left mouse button\r\n	down drag diagonally across the map to the opposite corner.\r\n	<br/>\r\n	Clicking the \"Select an area...\" button again allows replacing a previous area selection. <br/>\r\n	<strong>Notes:</strong>\r\n   <ul>\r\n      <li>The data does not cover all of Australia.</li>\r\n      <li>Restrict a search area to below four square degrees. eg 2x2 or 1x4</li>\r\n   </ul>\r\n	<p style=\"padding-top:5px\"><strong>Hint:</strong> If the map has focus, you can use the arrow keys to pan the map.\r\n		You can zoom in and out using the mouse wheel or the \"+\" and \"-\" map control on the top left of the map. If you\r\n		don\'t like the position of your drawn area, hit the \"Draw\" button and draw a new bounding box.\r\n	</p>\r\n</div>");
$templateCache.put("icsm/glossary/glossary.html","<div ng-controller=\"GlossaryCtrl as glossary\">\r\n	<div style=\"position:relative;padding:5px;padding-left:10px;\" >\r\n		<div class=\"panel panel-default\" style=\"padding:5px;\" >\r\n			<div class=\"panel-heading\">\r\n				<h3 class=\"panel-title\">Glossary</h3>\r\n			</div>\r\n			<div class=\"panel-body\">\r\n				\r\n				\r\n	<table class=\"table table-striped\">\r\n		<thead>\r\n			<tr>\r\n				<th>Term</th>\r\n				<th>Definition</th>\r\n			</tr>\r\n		</thead>\r\n		<tbody>\r\n			<tr ng-repeat=\"term in glossary.terms\">\r\n				<td>{{term.term}}</td>\r\n				<td>{{term.definition}}</td>\r\n			</tr>\r\n		</tbody>\r\n	</table>\r\n</div>\r\n</div>\r\n</div>");
$templateCache.put("icsm/contributors/contributors.html","<div class=\"contributors\" ng-mouseenter=\"over()\" ng-mouseleave=\"out()\" ng-class=\"(contributors.show || contributors.ingroup || contributors.stick) ? \'transitioned-down\' : \'transitioned-up\'\">\r\n   <div class=\"anchored\">\r\n      <a ng-repeat=\"contributor in contributors.orgs | activeContributors\" ng-href=\"{{contributor.href}}\" >\r\n         <img src=\"{{contributor.image}}\" alt=\"{{contributor.title}}\" class=\"elvis-logo\"></img>\r\n      </a>\r\n   </div>\r\n   <span style=\"float: right\">\r\n      <button class=\"undecorated contributors-unstick\" ng-click=\"unstick()\">X</button>\r\n   </span>\r\n</div>");
$templateCache.put("icsm/contributors/show.html","<a ng-mouseenter=\"over()\" ng-mouseleave=\"out()\"\r\n      style=\"padding-left: 60px;position: relative;top: 50px;\"\r\n      ng-click=\"toggleStick()\" href=\"javascript:void(0)\">Contributors</a>");
$templateCache.put("icsm/header/header.html","<div class=\"container-full common-header\" style=\"padding-right:10px; padding-left:10px\">\r\n    <div class=\"navbar-collapse collapse ga-header-collapse\">\r\n        <ul class=\"nav navbar-nav\">\r\n            <li class=\"hidden-xs\"><a href=\"/\"><h1 class=\"applicationTitle\">{{heading}}</h1></a></li>\r\n            <li class=\"hidden-xs\">\r\n               <icsm-contributors-link></icsm-contributors-link>\r\n            </li>\r\n        </ul>\r\n        <ul class=\"nav navbar-nav navbar-right nav-icons\">\r\n        	<li common-navigation ng-show=\"username\" role=\"menuitem\" style=\"padding-right:10px\"></li>\r\n			<li mars-version-display role=\"menuitem\"></li>\r\n			<li style=\"width:10px\"></li>\r\n        </ul>\r\n    </div><!--/.nav-collapse -->\r\n</div>\r\n\r\n<!-- Strap -->\r\n<div class=\"row\">\r\n    <div class=\"col-md-12\">\r\n        <div class=\"strap-blue\">\r\n        </div>\r\n        <div class=\"strap-white\">\r\n        </div>\r\n        <div class=\"strap-red\">\r\n        </div>\r\n    </div>\r\n</div>");
$templateCache.put("icsm/help/faqs.html","<div class=\"container\" style=\"width:100%;border: 1px solid lightgray\">\r\n	<p style=\"text-align: left; margin: 10px; font-size: 14px;\">\r\n		<strong>FAQS</strong>\r\n	</p>	\r\n\r\n	<h5 ng-repeat=\"faq in faqs\"><button type=\"button\" class=\"undecorated\" ng-click=\"focus(faq.key)\">{{faq.question}}</button></h5>\r\n	<hr/>\r\n	<div class=\"row\" ng-repeat=\"faq in faqs\">\r\n		<div class=\"col-md-12\">\r\n			<h5 tabindex=\"0\" id=\"faqs_{{faq.key}}\">{{faq.question}}</h5>\r\n			<span ng-bind-html=\"faq.answer\"></span>\r\n			<hr/>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/help/help.html","<div ng-controller=\"HelpCtrl as help\">\r\n	<div style=\"position:relative;padding:5px;padding-left:10px;\" >\r\n		<div class=\"panel panel-default\" style=\"padding:5px;\" >\r\n			<div class=\"panel-heading\">\r\n				<h3 class=\"panel-title\">Help</h3>\r\n			</div>\r\n			<div class=\"panel-body\">\r\n				The steps to get data!\r\n				<ol>\r\n					<li>Define area of interest</li>\r\n					<li>Select datasets</li>\r\n					<li>Confirm selections</li>\r\n					<li>Enter email address</li>\r\n					<li>Start extract</li>\r\n				</ol>\r\n				An email will be sent to you on completion of the data extract with a link to your data.\r\n				<icsm-faqs faqs=\"help.faqs\" ></icsm-faqs>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/panes/panes.html","<div class=\"container contentContainer\">\r\n	<div class=\"row icsmPanesRow\" >\r\n		<div class=\"icsmPanesCol\" ng-class=\"{\'col-md-12\':!view, \'col-md-7\':view}\" style=\"padding-right:0\">\r\n			<div class=\"expToolbar row noPrint\" icsm-toolbar-row map=\"root.map\"></div>\r\n			<div class=\"panesMapContainer\" geo-map configuration=\"data.map\">\r\n			    <geo-extent></geo-extent>\r\n			    <common-feature-info></common-feature-info>\r\n			    <icsm-layerswitch></icsm-layerswitch>\r\n			</div>\r\n    		<div geo-draw data=\"data.map.drawOptions\" line-event=\"elevation.plot.data\" rectangle-event=\"bounds.drawn\"></div>\r\n    		<div class=\"common-legend\" common-legend map=\"data.map\"></div>\r\n    		<div icsm-tabs class=\"icsmTabs\"  ng-class=\"{\'icsmTabsClosed\':!view, \'icsmTabsOpen\':view}\"></div>\r\n		</div>\r\n		<div class=\"icsmPanesColRight\" ng-class=\"{\'hidden\':!view, \'col-md-5\':view}\" style=\"padding-left:0; padding-right:0\">\r\n			<div class=\"panesTabContentItem\" ng-show=\"view == \'download\'\" icsm-view></div>\r\n			<div class=\"panesTabContentItem\" ng-show=\"view == \'maps\'\" icsm-maps></div>\r\n			<div class=\"panesTabContentItem\" ng-show=\"view == \'glossary\'\" icsm-glossary></div>\r\n			<div class=\"panesTabContentItem\" ng-show=\"view == \'help\'\" icsm-help></div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/panes/tabs.html","<!-- tabs go here -->\r\n<div id=\"panesTabsContainer\" class=\"paneRotateTabs\" style=\"opacity:0.9\" ng-style=\"{\'right\' : contentLeft +\'px\'}\">\r\n\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'download\'}\" ng-click=\"setView(\'download\')\">\r\n		<button class=\"undecorated\">Download</button>\r\n	</div>\r\n	<!-- \r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'search\'}\" ng-click=\"setView(\'search\')\">\r\n		<button class=\"undecorated\">Search</button>\r\n	</div>\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'maps\'}\" ng-click=\"setView(\'maps\')\">\r\n		<button class=\"undecorated\">Layers</button>\r\n	</div>\r\n	-->\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'glossary\'}\" ng-click=\"setView(\'glossary\')\">\r\n		<button class=\"undecorated\">Glossary</button>\r\n	</div>\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'help\'}\" ng-click=\"setView(\'help\')\">\r\n		<button class=\"undecorated\">Help</button>\r\n	</div>\r\n</div>\r\n");
$templateCache.put("icsm/results/abstractbutton.html","<button ng-show=\"show\" type=\"button\" class=\"undecorated\" title=\"View full title and abstract of this dataset\" ng-click=\"toggle()\">\r\n	<i class=\"fa fa-lg\" ng-class=\"{\'fa-caret-down active\':item.showAbstract, \'fa-caret-right\':!item.showAbstract}\"></i>\r\n</button>");
$templateCache.put("icsm/results/abstracttooltip.html","<div>\r\n{{item.metadata.title? item.metadata.title: \'Loading...\'}}\r\n</div>");
$templateCache.put("icsm/results/continue.html","<div class=\"continue-container\" ng-show=\"ctrl.selected.length\">\r\n   <button class=\"btn btn-primary\" ng-click=\"ctrl.review()\">Review {{ctrl.selected.length}} selected datasets (Approx: {{ctrl.selectedSize | fileSize}})</button>\r\n</div>\r\n\r\n");
$templateCache.put("icsm/results/orgheading.html","<h5>\r\n	<button class=\"undecorated\" ng-click=\"expansions[org.source] = !expansions[org.source]\"\r\n      uib-tooltip=\"Click to collapse/expand this group\" tooltip-append-to-body=\"true\"\r\n		aria-expanded=\"true\" aria-controls=\"collapse{{mappings[org.source].code}}\">\r\n      <img ng-src=\"{{mappings[org.source].image}}\" ng-attr-style=\"height:{{mappings[org.source].height}}px\"></img>\r\n      <strong>{{org.source}}</strong> (Showing {{org.downloadables | countMatchedDownloadables}} of {{org.downloadables	| countDownloadables}})\r\n   </button>\r\n	<span class=\"listTopExpander\">\r\n      <button class=\"undecorated\" ng-show=\"orgHasSelections()\" ng-click=\"deselectAll()\">\r\n         [Deselect all]\r\n      </button>\r\n      <button class=\"undecorated\" ng-click=\"expansions[org.source] = !expansions[org.source]\">\r\n         [{{expansions[org.source]?\"collapse\":\"expand\"}}]\r\n      </button>\r\n   </span>\r\n</h5>");
$templateCache.put("icsm/results/results.html","<div ng-show=\"!list || !list.length\">\r\n   <div class=\"alert alert-warning\" role=\"alert\"><strong>Select an area</strong> to find datasets within.</div>\r\n</div>\r\n\r\n<div ng-show=\"list.length\" class=\"results-list\">\r\n   <div class=\"row\">\r\n      <div class=\"col-md-12\" uib-tooltip=\"Number of intersecting or very near datasets to your area of interest.\">\r\n         <h4 style=\"display:inline-block\">Found {{products.length}} datasets</h4>\r\n      </div>\r\n   </div>\r\n   <div class=\"panel panel-default\" style=\"margin-bottom: 5px; margin-top: 5px;\">\r\n      <div class=\"panel-body\" style=\"float:clear\">\r\n         <span class=\"filter-text\" style=\"float:left;width:50%\" >\r\n            <div class=\"input-group input-group-sm\">\r\n               <span class=\"input-group-addon\" id=\"names1\">Filter:</span>\r\n               <input type=\"text\" ng-model=\"filters.filter\" class=\"form-control\" ng-change=\"update()\" placeholder=\"Filter names\" aria-describedby=\"names1\">\r\n            </div>\r\n         </span>\r\n         <span class=\"filter-type\" style=\"padding:10px; float:right\">\r\n				<span class=\"listTypeLabel\">Filter by type:</span>\r\n            <span ng-repeat=\"type in filters.types\" class=\"listType\">\r\n               <input type=\"checkbox\" ng-model=\"type.selected\" ng-change=\"update()\"/>\r\n               <span uib-tooltip=\"{{type.description}}\">{{type.label}}</span>\r\n            </span>\r\n         </span>\r\n      </div>\r\n   </div>\r\n\r\n   <div ng-repeat=\"available in list\" class=\"well\" style=\"padding-left:4px;padding-right:4px\" ng-show=\"list.someMatches(available)\"\r\n      ng-controller=\"listCtrl as list\">\r\n      <icsm-org-heading org=\"available\" expansions=\"expansions\" mappings=\"mappings\" products=\"products\"></icsm-org-heading>\r\n      <div uib-collapse=\"!expansions[available.source]\">\r\n         <div class=\"listRow\" ng-class-odd=\"\'listEven\'\" ng-repeat=\"(typeKey, types) in available.downloadables | allowedTypes\">\r\n            <h5><strong>{{typeKey}}</strong></h5>\r\n            <div ng-repeat=\"(key, items) in types\">\r\n               <div>\r\n                  <h5>\r\n                     <button ng-click=\"list.checkChildren(items)\" style=\"width:7em\" class=\"btn btn-xs btn-default\">\r\n                        <span ng-show=\"!list.childrenChecked(items)\">Select all</span>\r\n                        <span ng-show=\"list.childrenChecked(items)\">Deselect all</span>\r\n                     </button>\r\n                     <strong uib-tooltip=\"{{filter.types[key].description}}\">{{key}}</strong>\r\n                  </h5>\r\n                  <div ng-repeat=\"item in items | matchedItems\" icsm-abstract-hover item=\"item\" >\r\n                     <div tooltip-append-to-body=\"true\" uib-tooltip-template=\"\'icsm/results/abstracttooltip.html\'\" tooltip-popup-delay=\"400\"\r\n                              data-ng-mouseenter=\"show(item)\" data-ng-mouseleave=\"hide(item)\">\r\n                        <input type=\"checkbox\" ng-model=\"item.selected\" />\r\n                        <icsm-abstract item=\"item\"></icsm-abstract>\r\n                        <common-cc version=\"mappings[item.source].ccLicence\"></common-cc>\r\n                        <span class=\"listItem\" item=\"item\" icsm-abstract-link></span>\r\n                        <span ng-show=\"item.file_size\" style=\"float:right;padding-top:3px\">({{item.file_size | fileSize}})</span>\r\n                     </div>\r\n                     <div ng-show=\"item.showAbstract\" class=\"well\">\r\n                        <span ng-show=\"!item.metadata\">\r\n                           <i class=\"fa fa-spinner fa-spin fa-lg fa-fw\"></i>\r\n                           <span>Loading metadata...</span>\r\n                        </span>\r\n                        <div ng-show=\"item.metadata.abstract\">\r\n                           <strong>{{item.metadata.title}}</strong> -\r\n                           <span class=\"icsm-abstract-body\" ng-bind-html=\"item.metadata.abstractText\"></span >\r\n                        </div>\r\n                        <div ng-show=\"!item.metadata.abstract\">\r\n                           <i class=\"fa fa-lg fa-exclamation-triangle\" style=\"color:orange\"></i>\r\n                           There is no abstract available for this dataset.\r\n                        </div>\r\n                     </div>\r\n						</div>\r\n					</div>\r\n				</div>\r\n				<div style=\"text-align:right\"><button class=\"undecorated\" ng-click=\"expansions[available.source] = false\">[collapse]</button></div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/reviewing/reviewing.html","<div class=\"modal-header\">\r\n	<h3 class=\"modal-title splash\">Review datasets, provide email and continue</h3>\r\n</div>\r\n<div class=\"modal-body\" id=\"accept\" ng-form exp-enter=\"accept()\" icsm-splash-modal style=\"width: 100%; margin-left: auto; margin-right: auto;\">\r\n	<div class=\"row bg-warning\" ng-show=\"noneSelected(products)\">\r\n		<div class=\"col-md-10 center-block\" style=\"padding:5px; text-align:center\">\r\n			<strong>All datasets have been removed.</strong>\r\n		</div>\r\n		<div class=\"col-md-2\">\r\n			<button type=\"button\" style=\"float:right\" class=\"btn btn-primary\" ng-click=\"cancel()\">Close</button>\r\n		</div>\r\n	</div>\r\n	<div ng-hide=\"noneSelected(products)\" ng-controller=\"listCtrl as list\" >\r\n		<div class=\"row\">\r\n			<div class=\"col-md-12\">\r\n				<h4>{{list.selected.length}} Selected Datasets   <span ng-show=\"list.selectedSize\">(Approx: {{list.selectedSize | fileSize}})</span></h4>\r\n				Review and delete unwanted datasets.\r\n			</div>\r\n		</div>\r\n      <div class=\"reviewing-datasets\">\r\n		   <div class=\"row\" ng-repeat=\"product in products | reviewProductsSelected\"  ng-class-odd=\"\'reviewing-odd\'\">\r\n			   <div class=\"col-md-7\">\r\n				   <button type=\"button\" class=\"btn btn-default btn-xs\" ng-click=\"product.removed = !product.removed\">\r\n                  <i class=\"fa fa-2x\" ng-class=\"{\'fa-times-circle\': product.removed, \'fa-check-circle\': !product.removed}\" aria-hidden=\"true\"></i>\r\n               </button>\r\n               <span style=\"padding-left:7px\" ng-class=\"{\'exclude\': product.removed}\">{{product.file_name}}</span>\r\n			   </div>\r\n			   <div class=\"col-md-4\" style=\"padding:6px\">\r\n				   ({{product.source}}\r\n				   <i class=\"fa fa-arrow-right\" aria-hidden=\"true\"></i> {{product.type}}\r\n				   <i class=\"fa fa-arrow-right\" aria-hidden=\"true\"></i> {{product.group}})\r\n			   </div>\r\n			   <div class=\"col-md-1\" style=\"padding:6px\">\r\n			   	{{product.file_size | fileSize}}\r\n			   </div>\r\n		   </div>\r\n      </div>\r\n	</div>\r\n   <div class=\"row reviewing-divider\">\r\n		<div class=\"col-md-12\">\r\n			<p>\r\n				<strong>Email notification</strong> The extract of data can take some time. By providing an email address we will be\r\n				able to notify you when the job is complete. The email will provide a link to the extracted data which will be packaged\r\n				up as a single compressed file.\r\n			</p>\r\n			<div review-email></div>\r\n		</div>\r\n	</div>\r\n	<div class=\"row\" ng-controller=\"listCtrl as list\">\r\n		<div class=\"col-md-12\">\r\n			<div class=\"pull-right\" style=\"padding:8px;\">\r\n				<button type=\"button\" class=\"btn btn-primary\" ng-click=\"accept()\" ng-disabled=\"!data.email || !list.selected.length\">Start extract of datasets\r\n\r\n              </button>\r\n				<button type=\"button\" class=\"btn btn-primary\" ng-click=\"cancel()\">Cancel</button>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/splash/splash.html","<div class=\"modal-header\">\r\n   <h3 class=\"modal-title splash\">Elevation</h3>\r\n</div>\r\n<div class=\"modal-body\" id=\"accept\" ng-form exp-enter=\"accept()\" icsm-splash-modal style=\"width: 100%; margin-left: auto; margin-right: auto;\">\r\n	<div>\r\n		<p>\r\n			Here you can download point cloud and elevation datasets sourced from jurisdictions.\r\n		</p>\r\n		<p>\r\n			<a href=\"http://www.ga.gov.au/topographic-mapping/digital-elevation-data.html\" target=\"_blank\">Find out more on our Elevation page.</a>\r\n		</p>\r\n		<p>\r\n			Data can be downloaded at <strong>no charge</strong> and there is no limit to how many (please check the file size before you download your files).\r\n		</p>\r\n		<p>\r\n			<a href=\"http://opentopo.sdsc.edu/gridsphere/gridsphere?cid=contributeframeportlet&gs_action=listTools\" target=\"_blank\">Click here for Free GIS Tools.</a>\r\n		</p>\r\n      <h5>How to use</h5>\r\n      <p>\r\n         <ul>\r\n            <li>Pan and zoom the map to your area of interest,</li>\r\n            <li>Click on the \"Select an area...\" button to enable drawing,</li>\r\n            <li>Click on the map, holding the button down,</li>\r\n            <li>Drag to a diagonal corner (not too big, there is a limit of roughly 2 square degrees or 200 square km))</li>\r\n            <li>On release we will check for data within or very near your area of interest</li>\r\n            <li>If the list is large you can filter:\r\n               <ul>\r\n                  <li>Partial text match by typing in the filter field and/or</li>\r\n                  <li>You can restrict the display to either elevation (DEM) or point cloud file types</li>\r\n               </ul>\r\n            </li>\r\n            <li>Check against any file you would like to download. To reiterate, these files can be huge so take note of the file size before downloading</li>\r\n            <li>Review your selected datasets and submit.</li>\r\n            <li>An email will be sent to you with a link to all your data, zipped into a single file.</li>\r\n            <li>These files can be huge so take note of the file size before submitting or downloading</li>\r\n         </ul>\r\n      </p>\r\n      <h5>Hints</h5>\r\n      <p>\r\n         <ul>\r\n            <li>Hovering over many items will give you further information about the purpose of the item</li>\r\n            <li>Drawing a polyline allows you to measure distance along the polyline.</li>\r\n            <li>On completion on drawing a line the elevation along that line is plotted.</li>\r\n            <li>While the tool to draw your area of interest is enabled it is easiest to pan the map using the arrow keys.</li>\r\n            <li>There are many areas where there is no data though the coverage is improving all the time.</li\r\n         </ul>\r\n      </p>\r\n	</div>\r\n   <div style=\"padding:30px; padding-top:0; padding-bottom:40px; width:100%\">\r\n		<div class=\"pull-right\">\r\n		  	<button type=\"button\" class=\"btn btn-primary\" ng-model=\"seenSplash\" ng-focus=\"\" ng-click=\"accept()\">Continue</button>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/select/doc.html","<div ng-class-odd=\"\'odd\'\" ng-class-even=\"\'even\'\" ng-mouseleave=\"select.lolight(doc)\" ng-mouseenter=\"select.hilight(doc)\">\r\n	<span ng-class=\"{ellipsis:!expanded}\" tooltip-enable=\"!expanded\" style=\"width:100%;display:inline-block;\" \r\n			tooltip-class=\"selectAbstractTooltip\" tooltip=\"{{doc.abstract | truncate : 250}}\" tooltip-placement=\"bottom\">\r\n		<button type=\"button\" class=\"undecorated\" ng-click=\"expanded = !expanded\" title=\"Click to see more about this dataset\">\r\n			<i class=\"fa pad-right fa-lg\" ng-class=\"{\'fa-caret-down\':expanded,\'fa-caret-right\':(!expanded)}\"></i>\r\n		</button>\r\n		<download-add item=\"doc\" group=\"group\"></download-add>\r\n		<icsm-wms data=\"doc\"></icsm-wms>\r\n		<icsm-bbox data=\"doc\" ng-if=\"doc.showExtent\"></icsm-bbox>\r\n		<a href=\"http://www.ga.gov.au/metadata-gateway/metadata/record/{{doc.sysId}}\" target=\"_blank\" ><strong>{{doc.title}}</strong></a>\r\n	</span>\r\n	<span ng-class=\"{ellipsis:!expanded}\" style=\"width:100%;display:inline-block;padding-right:15px;\">\r\n		{{doc.abstract}}\r\n	</span>\r\n	<div ng-show=\"expanded\" style=\"padding-bottom: 5px;\">\r\n		<h5>Keywords</h5>\r\n		<div>\r\n			<span class=\"badge\" ng-repeat=\"keyword in doc.keywords track by $index\">{{keyword}}</span>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/select/group.html","<div class=\"panel panel-default\" style=\"margin-bottom:-5px;\" >\r\n	<div class=\"panel-heading\"><icsm-wms data=\"group\"></icsm-wms> <strong>{{group.title}}</strong></div>\r\n	<div class=\"panel-body\">\r\n   		<div ng-repeat=\"doc in group.docs\">\r\n   			<div select-doc doc=\"doc\" group=\"group\"></div>\r\n		</div>\r\n	</div>\r\n</div>\r\n");
$templateCache.put("icsm/select/select.html","<div>\r\n	<div style=\"position:relative;padding:5px;padding-left:10px;\" ng-controller=\"SelectCtrl as select\" class=\"scrollPanel\">\r\n		<div class=\"panel panel-default\" style=\"margin-bottom:-5px\">\r\n  			<div class=\"panel-heading\">\r\n  				<h3 class=\"panel-title\">Available datasets</h3>\r\n  			</div>\r\n  			<div class=\"panel-body\">\r\n				<div ng-repeat=\"doc in select.data.response.docs\" style=\"padding-bottom:7px\">\r\n					<div select-doc ng-if=\"doc.type == \'dataset\'\" doc=\"doc\"></div>\r\n					<select-group ng-if=\"doc.type == \'group\'\" group=\"doc\"></select-group>\r\n				</div>\r\n  			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/themes/themes.html","<div class=\"dropdown themesdropdown\">\r\n  <button class=\"btn btn-default dropdown-toggle themescurrent\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">\r\n    Theme\r\n    <span class=\"caret\"></span>\r\n  </button>\r\n  <ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\">\r\n    <li ng-repeat=\"item in themes\">\r\n       <a href=\"#\" title=\"{{item.title}}\" ng-href=\"{{item.url}}\" class=\"themesItemCompact\">\r\n         <span class=\"icsm-icon\" ng-class=\"item.className\"></span>\r\n         <strong style=\"vertical-align:top;font-size:110%\">{{item.label}}</strong>\r\n       </a>\r\n    </li>\r\n  </ul>\r\n</div>");
$templateCache.put("icsm/toolbar/toolbar.html","<div icsm-toolbar>\r\n	<div class=\"row toolBarGroup\">\r\n		<div class=\"btn-group searchBar\" ng-show=\"root.whichSearch != \'region\'\">\r\n			<div class=\"input-group\" geo-search>\r\n				<input type=\"text\" ng-autocomplete ng-model=\"values.from.description\" options=\'{country:\"au\"}\'\r\n							size=\"32\" title=\"Select a locality to pan the map to.\" class=\"form-control\" aria-label=\"...\">\r\n				<div class=\"input-group-btn\">\r\n    				<button ng-click=\"zoom(false)\" exp-ga=\"[\'send\', \'event\', \'icsm\', \'click\', \'zoom to location\']\"\r\n						class=\"btn btn-default\"\r\n						title=\"Pan and potentially zoom to location.\"><i class=\"fa fa-search\"></i></button>\r\n				</div>\r\n			</div>\r\n		</div>\r\n\r\n		<div class=\"pull-right\">\r\n			<div class=\"btn-toolbar radCore\" role=\"toolbar\"  icsm-toolbar>\r\n				<div class=\"btn-group\">\r\n					<!-- < icsm-state-toggle></icsm-state-toggle> -->\r\n				</div>\r\n			</div>\r\n\r\n			<div class=\"btn-toolbar\" style=\"margin:right:10px;display:inline-block\">\r\n				<div class=\"btn-group\">\r\n					<span class=\"btn btn-default\" common-baselayer-control max-zoom=\"16\" title=\"Satellite to Topography bias on base map.\"></span>\r\n				</div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/view/view.html","<div class=\"container-fluid downloadPane\" >\r\n	<div class=\"row\">\r\n		<div class=\"col-md-12\">\r\n			<h4><icsm-wms data=\"data.item\" ng-title=\"data.item.abstract\"></icsm-wms>{{data.item.title}}</h4>\r\n  			</div>\r\n	</div>\r\n	<icsm-clip data=\"data.item\"></icsm-clip>\r\n   <div class=\"list-container\">\r\n	   <icsm-list></icsm-list>\r\n   </div>\r\n	<div class=\"downloadCont\" icsm-search-continue></div>\r\n</div>");}]);