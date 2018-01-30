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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
	var RootCtrl = function RootCtrl($http, configService, mapService) {
		var _this = this;

		_classCallCheck(this, RootCtrl);

		mapService.getMap().then(function (map) {
			_this.map = map;
		});
		configService.getConfig().then(function (data) {
			_this.data = data;
			// If its got WebGL its got everything we need.
			try {
				var canvas = document.createElement('canvas');
				data.modern = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
			} catch (e) {
				data.modern = false;
			}
		});
	};

	RootCtrl.$invoke = ['$http', 'configService', 'mapService'];

	angular.module("IcsmApp", ['common.altthemes', 'common.baselayer.control', 'common.cc', 'common.featureinfo', 'common.header', 'common.legend', 'common.navigation',
	//'common.panes',

	'common.reset', 'common.storage', 'common.templates', 'explorer.config', 'explorer.confirm',
	// 'ed.download',
	'explorer.drag', 'explorer.enter', 'explorer.flasher', 'explorer.googleanalytics', 'explorer.httpdata', 'explorer.info', 'explorer.legend', 'explorer.message', 'explorer.modal', 'explorer.persist', 'explorer.projects', 'explorer.tabs', 'explorer.version', 'exp.ui.templates', 'explorer.map.templates', 'ui.bootstrap', 'ui.bootstrap-slider', 'ngAutocomplete', 'ngRoute', 'ngSanitize', 'page.footer',

	//'geo.baselayer.control',
	'geo.draw', 'geo.elevation', 'geo.geosearch', 'geo.map', 'geo.maphelper', 'geo.measure', 'icsm.bounds', 'icsm.contributors', 'icsm.clip', 'icsm.glossary', 'icsm.help', 'icsm.panes', 'icsm.products', "icsm.side-panel",
	// Alternate list
	'elvis.header', 'elvis.results', 'elvis.reviewing', 'icsm.mapevents', 'icsm.select', 'icsm.splash', 'icsm.layerswitch', 'icsm.templates', 'elevation.toolbar', 'icsm.view'])

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
}
"use strict";

{
   (function () {
      var fileSize = function fileSize(size) {
         var meg = 1000 * 1000;
         var gig = meg * 1000;
         var ter = gig * 1000;

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

      angular.module("icsm.bounds", ["icsm.message"]).directive('icsmBounds', ['$rootScope', 'icsmMessageService', 'boundsService', function ($rootScope, icsmMessageService, boundsService) {
         return {
            restrict: 'AE',
            link: function link() {
               boundsService.init().then(null, null, function notify(message) {
                  icsmMessageService.removeFlash();
                  switch (message.type) {
                     case "error":
                     case "warn":
                     case "info":
                        icsmMessageService[message.type](message.text);
                        break;
                     case "wait":
                        icsmMessageService.wait(message.text);
                        break;
                     default:
                        icsmMessageService.flash(message.text, message.duration ? message.duration : 8000, message.type === "wait");
                  }
               });
            }
         };
      }]).factory("boundsService", ['$http', '$q', '$rootScope', '$timeout', 'configService', 'flashService', 'messageService', function ($http, $q, $rootScope, $timeout, configService, flashService, messageService) {
         var clipTimeout = void 0,
             notify = void 0;
         return {
            init: function init() {
               notify = $q.defer();
               $rootScope.$on('icsm.clip.drawn', function (event, clip) {
                  send('Area drawn. Checking for data...');
                  _checkSize(clip).then(function (message) {
                     if (message.code === "success") {
                        getList(clip);
                     } else {
                        // $rootScope.$broadcast('icsm.clip.draw', { message: "oversize" });
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
            flashService.remove(notify);

            if (message) {
               if (type === "error") {
                  messageService.error(message);
               } else {
                  notify = flashService.add(message, duration, true);
               }
            }
            /*
              if (notify) {
               notify.notify({
                  text: message,
                  type: type,
                  duration: duration
               });
            }
            */
         }

         function _checkSize(clip) {
            var deferred = $q.defer();
            var result = drawn(clip);
            if (result && result.code) {
               switch (result.code) {
                  case "oversize":
                     $timeout(function () {
                        send("", "clear");
                        send("The selected area is too large to process. Please restrict to approximately " + "1.5 degrees square.", "error");
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
            return size > 2.25;
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
                        var hasData = false;
                        send("", "clear");
                        if (response.data.available_data) {
                           response.data.available_data.forEach(function (group) {
                              if (group.downloadables) {
                                 decorateDownloadables(group.downloadables);
                                 hasData = true;
                              }
                           });
                        }
                        if (!hasData) {
                           send("There is no data held in your selected area. Please try another area.", null, 4000);
                        }

                        $rootScope.$broadcast('site.selection', response.data);
                     }
                  }, function (err) {
                     // If it falls over we don't want to crash.
                     send("The service that provides the list of datasets is currently unavailable. " + "Please try again later.", "error");
                  });
               }
            });

            function decorateDownloadables(downloadables) {
               Object.keys(downloadables).forEach(function (groupname) {
                  var group = downloadables[groupname];
                  Object.keys(group).forEach(function (listName) {
                     var items = group[listName];

                     items.forEach(function (item) {
                        return decorateItem(item);
                     });
                  });
               });
            }

            function decorateItem(item) {
               item.fileSize = fileSize(item.file_size);
               if (item.product) {
                  //  "bbox" : "113,-44,154,-10"
                  var arr = item.bbox.split(",").map(function (num) {
                     return +num;
                  });
                  item.bbox = [Math.max(arr[0], clip.xMin), Math.max(arr[1], clip.yMin), Math.min(arr[2], clip.xMax), Math.min(arr[3], clip.yMax)].join(",");
               }
            }
         }
      }]);
   })();
}
'use strict';

{
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
            var timer = void 0;

            scope.clip = clipService.data.clip;

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

            $rootScope.$on('icsm.clip.draw', function (event, data) {
               if (data && data.message === "oversize") {
                  scope.oversize = true;
                  $timeout(function () {
                     delete scope.oversize;
                  }, 6000);
               } else {
                  delete scope.oversize;
               }
            });

            scope.initiateDraw = function () {
               messageService.info("Click on the map and drag to define your area of interest.");
               clipService.initiateDraw();
            };
         }
      };
   }]).factory("clipService", ['$q', '$rootScope', 'drawService', function ($q, $rootScope, drawService) {
      var options = {
         maxAreaDegrees: 4
      },
          service = {
         data: {
            clip: {}
         },
         initiateDraw: function initiateDraw() {
            $rootScope.$broadcast("clip.initiate.draw", { started: true });
            var clip = this.data.clip;
            delete clip.xMin;
            delete clip.xMax;
            delete clip.yMin;
            delete clip.yMax;
            delete clip.area;
            return drawService.drawRectangle({
               retryOnOversize: false
            });
         },

         cancelDraw: function cancelDraw() {
            drawService.cancelDrawRectangle();
         },

         setClip: function setClip(data) {
            return drawComplete(data);
         }
      };

      $rootScope.$on("bounds.drawn", function (event, data) {
         console.log("data", data);
         service.setClip(data);
         var c = service.data.clip;

         $rootScope.$broadcast('icsm.clip.drawn', c); // Let people know it is drawn
         $rootScope.$broadcast('icsm.bounds.draw', [c.xMin, c.yMin, c.xMax, c.yMax]); // Draw it
      });

      return service;

      function drawComplete(data) {
         var clip = service.data.clip;
         clip.xMax = data.bounds.getEast().toFixed(5);
         clip.xMin = data.bounds.getWest().toFixed(5);
         clip.yMax = data.bounds.getNorth().toFixed(5);
         clip.yMin = data.bounds.getSouth().toFixed(5);

         service.data.area = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);

         return service.data;
      }
   }]);
}
"use strict";

{
   var ContributorsService = function ContributorsService($http) {
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
   };

   angular.module('icsm.contributors', []).directive("icsmContributors", ["$interval", "contributorsService", function ($interval, contributorsService) {
      return {
         templateUrl: "icsm/contributors/contributors.html",
         scope: {},
         link: function link(scope, element) {
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
               element.find("a").blur();
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
}
"use strict";

{
   var GlossaryCtrl = function GlossaryCtrl($log, glossaryService) {
      var _this = this;

      $log.info("GlossaryCtrl");
      glossaryService.getTerms().then(function (terms) {
         _this.terms = terms;
      });
   };

   var GlossaryService = function GlossaryService($http) {
      var TERMS_SERVICE = "icsm/resources/config/glossary.json";

      return {
         getTerms: function getTerms() {
            return $http.get(TERMS_SERVICE, { cache: true }).then(function (response) {
               return response.data;
            });
         }
      };
   };

   angular.module("icsm.glossary", []).directive("icsmGlossary", [function () {
      return {
         templateUrl: "icsm/glossary/glossary.html"
      };
   }]).controller("GlossaryCtrl", GlossaryCtrl).factory("glossaryService", GlossaryService);

   GlossaryCtrl.$inject = ['$log', 'glossaryService'];


   GlossaryService.$inject = ['$http'];
}
"use strict";

{
	var HelpCtrl = function HelpCtrl($log, helpService) {
		var self = this;
		$log.info("HelpCtrl");
		helpService.getFaqs().then(function (faqs) {
			self.faqs = faqs;
		});
	};

	var HelpService = function HelpService($http) {
		var FAQS_SERVICE = "icsm/resources/config/faqs.json";

		return {
			getFaqs: function getFaqs() {
				return $http.get(FAQS_SERVICE, { cache: true }).then(function (response) {
					return response.data;
				});
			}
		};
	};

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


	HelpService.$inject = ['$http'];
}
'use strict';

{
   (function () {
      var insidePolygon = function insidePolygon(latlng, polyPoints) {
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
      };

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
                                 if (layer.options.switch === config.inside) {
                                    layer._container.style.display = settings.inside ? "block" : "none";
                                 }
                                 if (layer.options.switch === config.outside) {
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
   })();
}
'use strict';

{

	angular.module('elvis.header', []).controller('headerController', ['$scope', '$q', '$timeout', function ($scope, $q, $timeout) {

		var modifyConfigSource = function modifyConfigSource(headerConfig) {
			return headerConfig;
		};

		$scope.$on('headerUpdated', function (event, args) {
			$scope.headerConfig = modifyConfigSource(args);
		});
	}]).directive('elvisHeader', [function () {
		var defaults = {
			current: "none",
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
				current: "=",
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
}
"use strict";

{
   var PaneCtrl = function PaneCtrl(paneService) {
      var _this = this;

      paneService.data().then(function (data) {
         _this.data = data;
      });
   };

   var PaneService = function PaneService() {
      var data = {};

      return {
         add: function add(item) {},

         remove: function remove(item) {}
      };
   };

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

            $rootScope.$on('side.panel.change', function (event) {
               emitter();
               $timeout(emitter, 100);
               $timeout(emitter, 200);
               $timeout(emitter, 300);
               $timeout(emitter, 500);
               function emitter() {
                  var evt = document.createEvent("HTMLEvents");
                  evt.initEvent("resize", false, true);
                  window.dispatchEvent(evt);
               }
            });

            $scope.view = $scope.defaultItem;

            $rootScope.$broadcast("view.changed", $scope.view, null);

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
   }]).directive("icsmTabs", [function () {
      return {
         templateUrl: "icsm/panes/tabs.html",
         require: "^icsmPanes"
      };
   }]).controller("PaneCtrl", PaneCtrl).factory("paneService", PaneService);

   PaneCtrl.$inject = ["paneService"];


   PaneService.$inject = [];
}
'use strict';

{

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

      // We want to propagate the events from the download function so that it ripples through to other
      // parts of the system, namely the clip functionality.

      $rootScope.$on('ed.clip.extent.change.out', function showBbox(event, data) {
         console.log("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
      });

      $rootScope.$on('ed.clip.extent.change.in', function showBbox(event, data) {
         console.log("GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGE");
      });

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
}
"use strict";

{
   angular.module("icsm.message", []).directive("icsmMessage", ['icsmMessageService', function (icsmMessageService) {
      return {
         templateUrl: "icsm/message/message.html",
         link: function link(scope, element) {
            scope.message = icsmMessageService.data;
         }
      };
   }]).factory("icsmMessageService", ['$timeout', function ($timeout) {
      var data = {};
      var service = {
         get data() {
            return data;
         },

         wait: function wait(text) {
            return service.message("wait", text);
         },

         info: function info(text) {
            return service.message("info", text);
         },

         warn: function warn(text) {
            return service.message("warn", text);
         },

         error: function error(text) {
            return service.message("error", text);
         },

         clear: function clear() {
            return service.message(null, null);
         },

         message: function message(type, text) {
            data.type = type;
            data.text = text;
            $timeout(function () {
               service.removeFlash();
            }, 100000);
         },

         flash: function flash(text) {
            return service.message("flash", text);
         },

         removeFlash: function removeFlash() {
            data.type = null;
         }
      };

      return service;
   }]);
}
"use strict";

{

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
}
"use strict";

{
   (function () {
      var validClip = function validClip(clip) {
         var valid = isFinite(clip.yMax) && isFinite(clip.xMax) && isFinite(clip.yMin) && isFinite(clip.xMin);
         valid = valid && clip.yMax < 90 && clip.yMin > -90 && clip.xMax <= 180 && clip.xMin >= -180;
         valid = valid && clip.yMax > clip.yMin && clip.xMax > clip.xMin;
         return valid;
      };

      var DownloadService = function DownloadService(productsMapUtilsService, persistService) {
         var key = "download_email";
         var CLIPOPTIONS = {
            weight: 2,
            opacity: 0.9,
            fill: false,
            color: "#000000",
            width: 3,
            clickable: false
         };

         return {

            showClip: function showClip(clip) {
               this.removeClip(clip.layer);

               var bounds = [[clip.yMin, clip.xMin], [clip.yMax, clip.xMax]];

               clip.layer = productsMapUtilsService.createBounds(bounds, CLIPOPTIONS);
               productsMapUtilsService.showLayer(clip.layer);
            },

            removeClip: function removeClip(layer) {
               if (layer) {
                  productsMapUtilsService.hideLayer(layer);
               }
            },

            setEmail: function setEmail(email) {
               persistService.setItem(key, email);
            },

            getEmail: function getEmail() {
               return persistService.getItem(key).then(function (value) {
                  return value;
               });
            },
            // https://elvis20161a-ga.fmecloud.com/fmejobsubmitter/elvis_prod/DEMClipZipShip_Master_S3Source.fmw?geocat_number=${id}&out_grid_name=${filename}&input_coord_sys=LL-WGS84&ymin=${yMin}&ymax=${yMax}&xmin=${xMin}&xmax=${xMax}&output_format=${outFormat}&out_coord_sys=${outCoordSys}&email_address=${email}&opt_showresult=false&opt_servicemode=async
            submit: function submit(template, parameters) {
               var workingString = template;

               angular.forEach(parameters, function (item, key) {
                  workingString = workingString.replace("${" + key + "}", item);
               });

               $("#launcher")[0].src = workingString;
            }
         };
      };

      // The input validator takes care of order and min/max constraints. We just check valid existance.


      var validSize = function validSize(clip) {
         var size = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 16;

         return clip && angular.isNumber(clip.xMax) && angular.isNumber(clip.xMin) && angular.isNumber(clip.yMax) && angular.isNumber(clip.yMin) && !overSizeLimit(clip, size) && !underSizeLimit(clip);
      };

      var underSizeLimit = function underSizeLimit(clip) {
         var size = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);
         return size < 0.00000000001 || clip.xMax < clip.xMin;
      };

      var overSizeLimit = function overSizeLimit(clip, size) {
         // Shouldn't need abs but it doesn't hurt.
         var actual = Math.abs((clip.xMax - clip.xMin) * (clip.yMax - clip.yMin));
         return size && actual > size;
      };

      var constrainBounds = function constrainBounds(c, p) {
         var flag = false,
             ret = false;

         // Have we read the parameters yet?
         if (!p || empty(c.xMax) || empty(c.xMin) || empty(c.yMax) || empty(c.yMin)) {
            return false;
         }

         ret = flag = +c.xMax < +p.xMin;
         if (flag) {
            c.xMax = +p.xMin;
         }

         flag = +c.xMax > +p.xMax;
         ret = ret || flag;

         if (flag) {
            c.xMax = +p.xMax;
         }

         flag = +c.xMin < +p.xMin;
         ret = ret || flag;
         if (flag) {
            c.xMin = +p.xMin;
         }

         flag = +c.xMin > +c.xMax;
         ret = ret || flag;
         if (flag) {
            c.xMin = c.xMax;
         }

         // Now for the Y's
         flag = +c.yMax < +p.yMin;
         ret = ret || flag;
         if (flag) {
            c.yMax = +p.yMin;
         }

         flag = +c.yMax > +p.yMax;
         ret = ret || flag;
         if (flag) {
            c.yMax = +p.yMax;
         }

         flag = +c.yMin < +p.yMin;
         ret = ret || flag;
         if (flag) {
            c.yMin = +p.yMin;
         }

         flag = +c.yMin > +c.yMax;
         ret = ret || flag;
         if (flag) {
            c.yMin = +c.yMax;
         }

         return ret;

         function empty(val) {
            return angular.isUndefined(val) || val === "" || val === null;
         }
      };

      angular.module("product.download", []).directive("productDownloadButton", ['configService', function (configService) {
         return {
            template: "<button ng-click='item.showDownload = !item.showDownload' type='button' class='undecorated' title='Click to start download'>" + "<i class='fa fa-lg fa-download' ng-class='{active:item.showDownload}'></i></button>",
            scope: {
               item: "="
            },
            link: function link(scope, element, attrs) {
               console.log("What's up item!");
            }
         };
      }]).directive("productDownloadPanel", ['$rootScope', 'productDownloadService', 'flashService', function ($rootScope, productDownloadService, flashService) {
         return {
            templateUrl: "icsm/products/download.html",
            scope: {
               item: "="
            },
            link: function link(scope, element, attrs) {
               var clipMessage = void 0;

               scope.processing = {
                  clip: {},

                  get valid() {
                     return this.validClipSize && this.validEmail;
                  },

                  get validClip() {
                     return validClip(this.clip);
                  },

                  get validClipSize() {
                     return validClip(this.clip) && validSize(this.clip, scope.item.restrictSize);
                  },

                  get validEmail() {
                     return this.email;
                  },

                  get validProjection() {
                     return this.outCoordSys;
                  },

                  get validFormat() {
                     return this.outFormat;
                  },

                  get percentComplete() {
                     return (this.validClip ? 25 : 0) + (this.validEmail ? 25 : 0) + (this.validProjection ? 25 : 0) + (this.validFormat ? 25 : 0);
                  }
               };

               scope.item.processing = scope.processing;

               scope.drawn = function () {
                  return draw();
               };

               $rootScope.$on('icsm.clip.drawn', function (event, clip) {
                  scope.processing.clip = {
                     xMax: clip.xMax,
                     xMin: clip.xMin,
                     yMax: clip.yMax,
                     yMin: clip.yMin
                  };
                  scope.processing.message = "";
                  if (!scope.processing.validClip) {
                     scope.processing.message = "That is not a valid area for this dataset";
                  } else {
                     if (constrainBounds(scope.processing.clip, scope.item.bounds)) {
                        scope.processing.message = "Bounds restricted to fit within product's extent";
                     }

                     if (!validSize(scope.processing.clip, scope.item.restrictSize)) {
                        scope.processing.message = "That exceeds the area you can clip for this dataset. Restrict to " + scope.item.restrictSize + " square degrees.";
                     }
                  }
               });

               scope.$watch('item.showDownload', function (value, oldValue) {
                  if (value && !scope.processing.email) {
                     productDownloadService.getEmail().then(function (email) {
                        scope.processing.email = email;
                     });
                  }
               });
            }
         };
      }]).directive("productDownloadSubmit", ['configService', 'productDownloadService', 'messageService', function (configService, productDownloadService, messageService) {
         return {
            templateUrl: "icsm/products/submit.html",
            scope: {
               item: "=",
               processing: "="
            },
            link: function link(scope, element, attrs) {
               scope.submit = function () {
                  var processing = scope.processing;

                  productDownloadService.setEmail(processing.email);

                  // Assemble data
                  productDownloadService.submit(scope.item.template, {
                     id: scope.item.primaryId,
                     yMin: processing.clip.yMin,
                     yMax: processing.clip.yMax,
                     xMin: processing.clip.xMin,
                     xMax: processing.clip.xMax,
                     outFormat: processing.outFormat.code,
                     outCoordSys: processing.outCoordSys.code,
                     email: processing.email,
                     filename: ""
                  });
                  messageService.success("Submitted your job. An email will be delivered on completion.");
               };
            }
         };
      }]).factory("productDownloadService", DownloadService);

      DownloadService.$invoke = ['productsMapUtilsService', 'persistService'];
   })();
}
"use strict";

{
   (function () {
      var intersecting = function intersecting(collection, extent) {
         // The extent may have missing numbers so we don't restrict at that point.
         if (!extent || !collection || !angular.isNumber(extent.xMin) || !angular.isNumber(extent.xMax) || !angular.isNumber(extent.yMin) || !angular.isNumber(extent.yMax)) {
            return collection;
         }

         return collection.filter(function (item) {
            // We know these have valid numbers if it exists
            if (!item.extent) {
               return true;
            }
            // We have a restriction
            return item.extent.xMin <= extent.xMin && item.extent.xMax >= extent.xMax && item.extent.yMin <= extent.yMin && item.extent.yMax >= extent.yMax;
         });
      };

      angular.module("icsm.product", ["product.download"]).directive("productProjection", ['productsConfigService', function (productsConfigService) {
         return {
            templateUrl: "icsm/products/projection.html",
            scope: {
               processing: "="
            },
            link: function link(scope) {
               productsConfigService.config.then(function (config) {
                  scope.config = config;
               });
            }
         };
      }]).directive("productFormats", ['productsConfigService', function (productsConfigService) {
         return {
            templateUrl: "icsm/products/formats.html",
            scope: {
               processing: "="
            },
            link: function link(scope) {
               productsConfigService.config.then(function (config) {
                  scope.config = config;
               });
               console.log("What's up doc!");
            }
         };
      }]).directive('productEmail', [function () {
         return {
            templateUrl: 'icsm/products/email.html',
            scope: {
               processing: "="
            }
         };
      }]).filter("productIntersect", function () {
         return intersecting;
      });

      ;
   })();
}
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   (function () {
      angular.module("icsm.products", ["icsm.product"]).provider('productsConfigService', [function () {
         var location = "icsm/resources/config/download.json";

         this.setLocation = function (newLocation) {
            location = newLocation;
         };

         this.$get = ["$http", function factory($http) {
            return new DownloadConfig(location, $http);
         }];
      }]);

      var DownloadConfig = function () {
         function DownloadConfig(url, $http) {
            _classCallCheck(this, DownloadConfig);

            this.$http = $http;
            this.location = url;
         }

         _createClass(DownloadConfig, [{
            key: "child",
            value: function child(name) {
               return this.config.then(function (data) {
                  return data[name];
               });
            }
         }, {
            key: "initiateServiceTemplates",
            get: function get() {
               return child('initiateServiceTemplates');
            }
         }, {
            key: "processingTemplates",
            get: function get() {
               return this.child('processing');
            }
         }, {
            key: "outputFormat",
            get: function get() {
               return this.child('outFormat');
            }
         }, {
            key: "defaultOutputFormat",
            get: function get() {
               return this.outputFormat.then(function (list) {
                  return list.find(function (item) {
                     return item.default;
                  });
               });
            }
         }, {
            key: "defaultOutputCoordinateSystem",
            get: function get() {
               return this.outputCoordinateSystem.then(function (systems) {
                  return systems.find(function (item) {
                     return item.default;
                  });
               });
            }
         }, {
            key: "outputCoordinateSystem",
            get: function get() {
               return this.child('outCoordSys');
            }
         }, {
            key: "datasets",
            get: function get() {
               return this.child('datasets');
            }
         }, {
            key: "config",
            get: function get() {
               return this.$http.get(this.location, { cache: true }).then(function (response) {
                  return response.data;
               });
            }
         }]);

         return DownloadConfig;
      }();
   })();
}
'use strict';

{

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
}
'use strict';

{
   (function () {
      var fileSize = function fileSize(size) {
         var meg = 1000 * 1000;
         var gig = meg * 1000;
         var ter = gig * 1000;

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

      var ListCtrl = function ListCtrl(listService) {
         this.service = listService;

         this.checkChildren = function (children) {
            var allChecked = this.childrenChecked(children);
            var filtered = children;
            if (!allChecked) {
               filtered = children.filter(function (child) {
                  return child.matched;
               });
            }
            filtered.forEach(function (child) {
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

         this.someChildMatches = function (downloadables) {
            var matches = false;
            angular.forEach(group, function (subGroup) {
               matches |= subGroup.some(function (item) {
                  return item.matched;
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
      };

      angular.module("elvis.results", ['elvis.results.continue', 'icsm.subtype', 'icsm.unreleased']).directive('productsDialog', ['productsConfigService', 'listService', function (productsConfigService, listService) {
         return {
            restrict: 'AE',
            link: function link(scope) {
               var data = scope.processing = listService.data;
               productsConfigService.defaultOutputCoordinateSystem.then(function (item) {
                  return data.outCoordSys = item;
               });
               productsConfigService.defaultOutputFormat.then(function (format) {
                  return data.outFormat = format;
               });
            }
         };
      }]).directive('icsmOrgHeading', [function () {
         return {
            templateUrl: 'icsm/results/orgheading.html',
            restrict: 'AE',
            scope: {
               org: "=",
               mappings: "="
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
                        var name = product.file_name || product.project_name || "";
                        product.matched = name.toUpperCase().indexOf(upperFilter) > -1;
                     });
                  }
                  scope.$broadcast("filter.changed");
               };

               scope.show = function (data) {
                  var bbox = toNumberArray(data.bbox);
                  $rootScope.$broadcast('icsm.bbox.draw', bbox);
               };

               scope.hide = function (data) {
                  $rootScope.$broadcast('icsm.bbox.draw', null);
               };

               $rootScope.$on("clip.initiate.draw", function (event, data) {
                  scope.list = null;
                  scope.products = [];
                  scope.productsMap = [];
               });

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
            template: "<a target='_blank' ng-if='url' ng-href='{{url}}'>{{item[name]}}</a><span ng-if='!url' ng-bind='item.file_name'></span>",
            scope: {
               item: "=",
               name: "@?"
            },
            link: function link(scope, element) {
               if (!scope.name) {
                  scope.name = "file_name";
               }

               var data = {
                  file_name: scope.item[scope.name],
                  metadata_url: scope.item.metadata_url,
                  source: scope.item.source
               };
               scope.url = listService.getLink(data);
            }
         };
      }]).controller('listCtrl', ListCtrl).factory('listService', ['$http', '$rootScope', function ($http, $rootScope) {
         var service = {};
         var expansions = {};

         var strategies = new Strategies($http);

         service.data = {
            id: "listService_data",
            filter: "",
            types: []
         };

         $rootScope.$on('icsm.clip.drawn', function (event, clip) {
            return service.data.clip = clip;
         });

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
                  if (!Array.isArray(types)) {
                     angular.forEach(types, function (items) {
                        count += items.filter(function (item) {
                           return item.matched;
                        }).length;
                     });
                  }
               });
               return count;
            }
         };
      }).filter("countMatchedItems", function () {
         return function (items) {
            if (!items) {
               return "";
            } else {
               return items.filter(function (item) {
                  return item.matched;
               }).length;
            }
         };
      }).filter("hasTypeMatches", function () {
         return function (types) {
            if (!types) {
               return false;
            }
            var count = 0;
            Object.keys(types).forEach(function (key) {
               count += types[key].filter(function (item) {
                  return item.matched;
               }).length;
            });
            return count > 0;
         };
      }).filter("matchedTypes", function () {
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
      }).filter("matchedGroups", [function () {
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
      }]).filter("matchedItems", function () {
         return function (list) {
            return list.filter(function (item) {
               return item.matched;
            });
         };
      }).filter("keysLength", [function () {
         return function (list) {
            if (!list) {
               return 0;
            }
            return Object.keys(list).reduce(function (sum, key) {
               return sum + list[key].length;
            }, 0);
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
         return fileSize;
      });

      ListCtrl.$inject = ['listService'];


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
   })();
}
"use strict";

{
   (function () {
      var toNumberArray = function toNumberArray(numbs) {
         if (angular.isArray(numbs) || !numbs) {
            return numbs;
         }
         return numbs.split(/,\s*/g).map(function (numb) {
            return +numb;
         });
      };

      angular.module("icsm.subtype", ['bw.paging']).directive("subtype", ['$rootScope', function ($rootScope) {
         return {
            templateUrl: "icsm/results/subtype.html",
            scope: {
               items: "=",
               mappings: "="
            },
            link: function link(scope) {
               var timer = null;

               scope.paging = {
                  page: 1,
                  pageSize: 20
               };

               scope.$on("filter.changed", function () {
                  console.log("Filter changed - Subtype");
                  scope.setPage(1, 20);
               });

               scope.setPage = function (page, pagesize) {
                  var matchedItems = scope.items.filter(function (item) {
                     return item.matched;
                  });
                  scope.data = matchedItems.slice(pagesize * (page - 1), page * pagesize);
               };

               scope.setPage(1, 20);

               scope.show = function (data) {
                  var bbox = toNumberArray(data.bbox);
                  $rootScope.$broadcast('icsm.bbox.draw', bbox);
               };

               scope.hide = function (data) {
                  $rootScope.$broadcast('icsm.bbox.draw', null);
               };
            }
         };
      }]).filter("hasProducts", function () {
         return function (items) {
            return items.some(function (item) {
               return item.product;
            });
         };
      }).filter("productsSummary", function () {
         return function (items) {
            var count = items.filter(function (item) {
               return item.product;
            }).length;
            var response = " including ";
            switch (count) {
               case 1:
                  response += "1 product";
                  break;
               default:
                  response += count + " products";
            }
            return response;
         };
      }).filter("productsCount", function () {
         return function (items) {
            return items ? items.filter(function (item) {
               return item.product;
            }).length : 0;
         };
      });
   })();
}
'use strict';

{
   (function () {
      var captured = function captured(twoDates) {
         if (!twoDates) {
            return twoDates;
         }

         var dates = twoDates.split(" - ");
         if (dates.length !== 2) {
            return twoDates;
         }

         return formatDate(dates[0]) + " - " + formatDate(dates[1]);
      };

      var formatDate = function formatDate(data) {
         if (data.length !== 8) {
            return data;
         }
         return data.substr(0, 4) + "/" + data.substr(4, 2) + "/" + data.substr(6, 2);
      };

      var toNumberArray = function toNumberArray(numbs) {
         if (angular.isArray(numbs) || !numbs) {
            return numbs;
         }
         return numbs.split(/,\s*/g).map(function (numb) {
            return +numb;
         });
      };

      angular.module('icsm.unreleased', []).directive('icsmUnreleased', ['$rootScope', function ($rootScope) {
         return {
            templateUrl: "icsm/results/unreleased.html",
            scope: {
               types: "="
            },
            link: function link(scope) {
               console.log("Unrelease me!");
               scope.show = function (data) {
                  var bbox = toNumberArray(data.bbox);
                  $rootScope.$broadcast('icsm.bbox.draw', bbox);
               };

               scope.hide = function (data) {
                  $rootScope.$broadcast('icsm.bbox.draw', null);
               };
            }
         };
      }]).directive('icsmProjectAbstract', ['listService', function (listService) {
         return {
            templateUrl: "icsm/results/abstractbutton.html",
            scope: {
               project: "="
            },
            link: function link(scope) {
               scope.item = {};

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
      }]).filter("captured", function () {
         return captured;
      }).filter("reverseDate", function () {
         return formatDate;
      });
   })();
}
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

{
   (function () {
      var transformTemplate = function transformTemplate(template, data) {
         var response = template;
         angular.forEach(data, function (value, key) {
            response = response.replace("{" + key + "}", encodeURIComponent(value));
         });
         return response;
      };

      var convertFlatToStructured = function convertFlatToStructured(flat) {
         var fields = ["file_url", "file_name", "project_name", "product", "metadata_id", "file_size", "bbox"]; // ["index_poly_name", "file_name", "file_url", "file_size", "file_last_modified", "bbox"]
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
      };

      angular.module("elvis.reviewing", []).directive('icsmReview', ['$rootScope', '$uibModal', '$log', 'messageService', 'reviewService', function ($rootScope, $uibModal, $log, messageService, reviewService) {
         return {
            link: function link(scope, element) {
               var modalInstance;
               scope.data = reviewService.data;

               // TODO: Why is this here? What is trying to override data?
               scope.$watch("data", function (value, old) {
                  if (old) {
                     console.log("Why?", value);
                     scope.data = reviewService.data;
                  }
               });

               scope.$watch("data.reviewing", function (value) {
                  if (value) {
                     modalInstance = $uibModal.open({
                        templateUrl: 'icsm/reviewing/reviewing.html',
                        size: "lg",
                        backdrop: "static",
                        keyboard: false,
                        controller: ['$scope', '$uibModalInstance', 'listService', 'products', function ($scope, $uibModalInstance, listService, products) {
                           var selected = scope.selected = products.filter(function (product) {
                              return product.selected;
                           });
                           scope.derived = selected.filter(function (selection) {
                              return selection.product;
                           });

                           listService.getMappings().then(function (response) {
                              $scope.mappings = response;
                           });

                           $scope.products = convertFlatToStructured(selected).available_data;

                           $scope.accept = function () {
                              $uibModalInstance.close(true, $scope.products);
                           };

                           $scope.cancel = function () {
                              $uibModalInstance.close(false);
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
                        reviewService.removeRemoved();
                        scope.data.reviewing = false;
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
      }).filter('reviewSumSize', function () {
         return function (products) {
            return products.reduce(function (sum, product) {
               return sum + (product.file_size ? +product.file_size : product.product ? 500000000 : 0);
            }, 0);
         };
      }).factory('reviewService', ['$http', '$q', 'clipService', 'configService', 'listService', 'persistService', function ($http, $q, clipService, configService, listService, persistService) {
         var key = "elvis_download_email";
         var data = listService.data;
         var service = {
            get data() {
               return data;
            },

            set data(data) {
               console.log("What the hell!");
               data;
            },

            get products() {
               return listService.products;
            },

            startExtractUsingElvis: function startExtractUsingElvis(config) {
               var clip = clipService.data.clip;
               this.setEmail(data.email);

               var selected = listService.products.filter(function (product) {
                  return product.selected;
               });
               var products = selected.filter(function (product) {
                  return product.product;
               });
               var files = selected.filter(function (product) {
                  return !product.product;
               });
               var jobsCount = 0;

               var template = config.elvisTemplate;

               if (products.length) {
                  var _ret2 = function () {
                     var submit = function submit() {
                        jobsCount++;

                        var product = products[index++];
                        var parameters = Object.assign({}, clip, {
                           id: product.metadata_id,
                           filename: "",
                           outFormat: data.outFormat.code,
                           outCoordSys: data.outCoordSys.code,
                           email: data.email
                        });

                        return postProduct(template, parameters).then(function (response) {
                           if (index < products.length) {
                              return submit();
                           } else {
                              // Clear selections
                              products.forEach(function (product) {
                                 return product.selected = false;
                              });
                              if (files.length) {
                                 return postFiles();
                              } else {
                                 return finish();
                              }
                           }
                        });
                     };

                     console.log("We are processing products.");
                     var index = 0;

                     return {
                        v: submit()
                     };
                  }();

                  if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
               }

               if (!products.length && files.length) {
                  console.log("We are processing files");
                  return postFiles();
               }

               // That's the job done.

               function postProduct(template, parameters) {
                  var workingString = template;

                  angular.forEach(parameters, function (item, key) {
                     workingString = workingString.replace("${" + key + "}", item);
                  });

                  return $http({
                     method: 'GET',
                     url: workingString
                  }).then(function (response) {
                     return finish();
                  }, function (d) {
                     return {
                        status: "error",
                        message: "Sorry but the service failed to respond. Try again later."
                     };
                  });
               }

               function finish() {
                  return {
                     status: "success",
                     message: jobsCount > 1 ? "Your jobs have been submitted. You will receive " + jobsCount + " emails with the results soon." : "Your job has been submitted. You will receive an email with the results soon."
                  };
               }

               function postFiles() {
                  jobsCount++;
                  var postData = convertFlatToStructured(listService.products.filter(function (product) {
                     return product.selected && !product.product || product.type === "Unreleased Data";
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
                     return finish();
                  }, function (d) {
                     return {
                        status: "error",
                        message: "Sorry but the service failed to respond. Try again later."
                     };
                  });
               }
            },

            startExtract: function startExtract() {
               return configService.getConfig("processing").then(function (config) {
                  if (config.useElvis) {
                     return service.startExtractUsingElvis(config);
                  }

                  var clip = clipService.data.clip;
                  this.setEmail(data.email);

                  console.log("We are processing files");
                  return postFiles();

                  function finish() {
                     return {
                        status: "success",
                        message: "Your job has been submitted. You will receive an email with the results soon."
                     };
                  }

                  function postFiles() {
                     var postData = convertFlatToStructured(listService.products.filter(function (product) {
                        return product.selected || product.type === "Unreleased Data";
                     }));

                     postData.parameters = {
                        xmin: clip.xMin,
                        xmax: clip.xMax,
                        ymin: clip.yMin,
                        ymax: clip.yMax,
                        email: data.email
                     };

                     if (data.outCoordSys) {
                        postData.parameters.outCoordSys = data.outCoordSys.code;
                     }

                     if (data.outFormat) {
                        postData.parameters.outFormat = data.outFormat.code;
                     }

                     // console.log(JSON.stringify(postData, null, 3))
                     // return finish();

                     listService.products.forEach(function (product) {
                        product.selected = product.removed = false;
                     });

                     return $http({
                        method: 'POST',
                        url: config.postProcessingUrl,
                        data: postData,
                        headers: { "Content-Type": "application/json" }
                     }).then(function (response) {
                        return finish();
                     }, function (d) {
                        return {
                           status: "error",
                           message: "Sorry but the service failed to respond. Try again later."
                        };
                     });
                  }
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
            },

            clipProduct: function clipProduct() {}
         };

         persistService.getItem(key).then(function (value) {
            service.data.email = value;
         });

         return service;
      }]);
   })();
}
"use strict";

{
   (function () {
      var SelectService = function SelectService($http, $q, $rootScope, $timeout, mapService, configService) {
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
      };

      var servicesFactory = function servicesFactory(uris) {
         var protocols = {
            WCS: "OGC:WCS",
            WFS: "OGC:WFS",
            WMS: "OGC:WMS"
         };

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
         return new Services(uris);
      };

      angular.module("icsm.select.service", []).factory("selectService", SelectService);

      SelectService.$inject = ['$http', '$q', '$rootScope', '$timeout', 'mapService', 'configService'];
   })();
}
"use strict";

{
   var SelectCriteriaCtrl = function SelectCriteriaCtrl(selectService) {
      this.criteria = selectService.getSelectCriteria();

      this.refresh = function () {
         selectService.refresh();
      };
   };

   var SelectCtrl = function SelectCtrl($rootScope, configService, flashService, selectService) {
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
   };

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


   SelectCtrl.$inject = ['$rootScope', 'configService', 'flashService', 'selectService'];
}
'use strict';

{
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
}
'use strict';

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
      key: 'constructLink',
      value: function constructLink(item) {
         return null;
      }
   }, {
      key: 'hasMetadata',
      value: function hasMetadata(item) {
         return false;
      }
   }, {
      key: 'requestMetadata',
      value: function requestMetadata(item) {
         return BaseStrategy.resolvedPromise({
            title: this.NO_METADATA
         });
      }
   }], [{
      key: 'resolvedPromise',
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
      key: 'extractData',
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
            data.title = _get(BaseStrategy.__proto__ || Object.getPrototypeOf(BaseStrategy), 'NO_METADATA', this);
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

      // https://ecat.ga.gov.au/geonetwork/srv/eng/xml.metadata.get?uuid=22be4b55-2465-4320-e053-10a3070a5236
      var _this3 = _possibleConstructorReturn(this, (GaStrategy.__proto__ || Object.getPrototypeOf(GaStrategy)).call(this, http));

      _this3.GA_LINK_METADATA_TEMPLATE = 'https://ecat.ga.gov.au/geonetwork/srv/eng/search#!${uuid}';
      _this3.GA_METADATA_TEMPLATE = 'https://ecat.ga.gov.au/geonetwork/srv/eng/xml.metadata.get?uuid=${uuid}';
      _this3.UUID_REG_EX = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;
      return _this3;
   }

   _createClass(GaStrategy, [{
      key: 'constructLink',
      value: function constructLink(item) {
         var uuid = item.metadata_id;
         return uuid ? this.GA_LINK_METADATA_TEMPLATE.replace("${uuid}", uuid) : null;
      }
   }, {
      key: 'hasMetadata',
      value: function hasMetadata(item) {
         return !!this.constructLink(item);
      }
   }, {
      key: 'requestMetadata',
      value: function requestMetadata(item) {
         var _this4 = this;

         var uuid = item.metadata_id;
         var url = uuid ? "xml2js/" + this.GA_METADATA_TEMPLATE.replace("${uuid}", uuid) : null;
         if (url) {
            return this.http.get(url).then(function (response) {
               return BaseStrategy.extractData(response.data);
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
      key: 'constructLink',
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
      key: 'hasMetadata',
      value: function hasMetadata(item) {
         return true;
      }
   }, {
      key: 'requestMetadata',
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
               title: _get(NswStrategy.prototype.__proto__ || Object.getPrototypeOf(NswStrategy.prototype), 'NO_METADATA', _this6)
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

      _this8.XML_METADATA_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/rest/document?id={metadata_id}&f=xml";
      _this8.QLD_METADATA_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/rest/document?id={EB442CAB-D714-40D8-82C2-A01CA4661324}&f=xml";
      _this8.QLD_HTML_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/custom/detail.page?fid={EB442CAB-D714-40D8-82C2-A01CA4661324}";
      _this8.FRASER_COAST_METADATA_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/rest/document?id={E8CEF5BA-A1B7-4DE5-A703-8161FD9BD3CF}&f=xml";
      _this8.FRASER_COAST_HTML_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/custom/detail.page?fid={E8CEF5BA-A1B7-4DE5-A703-8161FD9BD3CF}";
      _this8.FRASER_COAST_BOUNDS = [152.331, -26.003, 153.370, -24.692]; //  Extracted from metadata XML


      return _this8;
   }

   _createClass(QldStrategy, [{
      key: 'constructLink',
      value: function constructLink(item) {
         if (item.metadata_url) {
            return item.metadata_url;
         }

         var bbox = item.bbox.split(",").map(function (val) {
            return parseFloat(val.trim());
         });
         if (bbox[0] >= this.FRASER_COAST_BOUNDS[0] && bbox[1] >= this.FRASER_COAST_BOUNDS[1] && bbox[2] <= this.FRASER_COAST_BOUNDS[2] && bbox[0] >= this.FRASER_COAST_BOUNDS[3]) {
            return this.FRASER_COAST_HTML_TEMPLATE;
         } else {
            return this.QLD_HTML_TEMPLATE;
         }
      }
   }, {
      key: 'hasMetadata',
      value: function hasMetadata(item) {
         return true;
      }
   }, {
      key: 'requestMetadata',
      value: function requestMetadata(item) {
         var _this9 = this;

         var url = void 0;

         if (item.metadata_id) {
            url = this.XML_METADATA_TEMPLATE.replace("metadata_id", item.metadata_id);
         } else {
            url = this.QLD_METADATA_TEMPLATE;
            var bbox = item.bbox.split(",").map(function (val) {
               return parseFloat(val.trim());
            });

            if (bbox[0] >= this.FRASER_COAST_BOUNDS[0] && bbox[1] >= this.FRASER_COAST_BOUNDS[1] && bbox[2] <= this.FRASER_COAST_BOUNDS[2] && bbox[0] >= this.FRASER_COAST_BOUNDS[3]) {
               url = this.FRASER_COAST_METADATA_TEMPLATE;
            }
         }

         return this.http.get("xml2js/" + url).then(function (response) {
            return BaseStrategy.extractData(response.data);
         }, function (err) {
            return {
               title: _get(QldStrategy.prototype.__proto__ || Object.getPrototypeOf(QldStrategy.prototype), 'NO_METADATA', _this9)
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
      key: 'strategy',
      value: function strategy(name) {
         var strategy = this.strategies[name];
         return strategy ? strategy : this.unknown;
      }
   }]);

   return Strategies;
}();
'use strict';

{
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
}
'use strict';

{

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
}
"use strict";

{

   angular.module("elevation.toolbar", []).directive("elevationToolbar", [function () {
      return {
         restrict: "AE",
         templateUrl: "icsm/toolbar/toolbar.html",
         controller: 'toolbarLinksCtrl',
         transclude: true
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
}
"use strict";

{
   var DownloadCtrl = function DownloadCtrl(downloadService) {
      downloadService.data().then(function (data) {
         this.data = data;
      }.bind(this));

      this.remove = function () {
         downloadService.clear();
      };

      this.changeEmail = function (email) {
         downloadService.setEmail(email);
      };
   };

   var DownloadService = function DownloadService($http, $q, $rootScope, mapService, storageService) {
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
   };

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


   DownloadService.$inject = ['$http', '$q', '$rootScope', 'mapService', 'storageService'];
}
angular.module("icsm.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("icsm/app/app.html","<div>\r\n	<!-- BEGIN: Sticky Header -->\r\n	<div explorer-header style=\"z-index:1\"\r\n			class=\"navbar navbar-default navbar-fixed-top\"\r\n			heading=\"\'Elevation\'\"\r\n			headingtitle=\"\'ICSM\'\"\r\n			breadcrumbs=\"[{name:\'ICSM\', title: \'Reload Elevation\', url: \'.\'}]\"\r\n			helptitle=\"\'Get help about Elevation\'\"\r\n			helpalttext=\"\'Get help about Elevation\'\">\r\n	</div>\r\n	<!-- END: Sticky Header -->\r\n\r\n	<!-- Messages go here. They are fixed to the tab bar. -->\r\n	<div explorer-messages class=\"marsMessages noPrint\"></div>\r\n	<icsm-panes data=\"root.data\" default-item=\"download\"></icsm-panes>\r\n</div>");
$templateCache.put("icsm/clip/clip.html","<div class=\"well well-sm\" style=\"margin-bottom:5px\">\r\n	<div class=\"container-fluid\">\r\n		<div class=\"row\">\r\n			<div class=\"col-md-12\" style=\"padding:0\">\r\n				<div class=\"\" role=\"group\" aria-label=\"...\">\r\n					<button ng-click=\"initiateDraw()\" ng-disable=\"client.drawing\"\r\n                      tooltip-append-to-body=\"true\" tooltip-placement=\"bottom\" uib-tooltip=\"Enable drawing of a bounding box. On enabling, click on the map and drag diagonally\"\r\n						class=\"btn btn-primary btn-default\">Select an area...</button>\r\n					<button ng-click=\"showInfo = !showInfo\" tooltip-placement=\"bottom\" uib-tooltip=\"Information.\" style=\"float:right\" class=\"btn btn-primary btn-default\"><i class=\"fa fa-info\"></i></button>\r\n				</div>\r\n				<exp-info title=\"Selecting an area\" show-close=\"true\" style=\"width:450px;position:fixed;top:200px;right:40px\" is-open=\"showInfo\">\r\n					<icsm-info-bbox></icsm-info-bbox>\r\n            </exp-info>\r\n            <div class=\"row\" ng-hide=\"(!clip.xMin && clip.xMin !== 0) || oversize\" style=\"padding-top:7px;\">\r\n               <div class=\"col-md-12 ng-binding\">\r\n                  Selected bounds: {{clip.xMin | number : 4}}° west,\r\n                     {{clip.yMax | number : 4}}° north,\r\n                     {{clip.xMax | number : 4}}° east,\r\n                     {{clip.yMin | number : 4}}° south\r\n               </div>\r\n            </div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/clip/infobbox.html","<div class=\"\">\r\n	<strong style=\"font-size:120%\">Select an area of interest.</strong>\r\n   By hitting the \"Select an area...\" button an area on the map can be selected with the mouse by clicking a\r\n   corner and while holding the left mouse button\r\n	down drag diagonally across the map to the opposite corner.\r\n	<br/>\r\n	Clicking the \"Select an area...\" button again allows replacing a previous area selection. <br/>\r\n	<strong>Notes:</strong>\r\n   <ul>\r\n      <li>The data does not cover all of Australia.</li>\r\n      <li>Restrict a search area to below four square degrees. eg 2x2 or 1x4</li>\r\n   </ul>\r\n	<p style=\"padding-top:5px\"><strong>Hint:</strong> If the map has focus, you can use the arrow keys to pan the map.\r\n		You can zoom in and out using the mouse wheel or the \"+\" and \"-\" map control on the top left of the map. If you\r\n		don\'t like the position of your drawn area, hit the \"Draw\" button and draw a new bounding box.\r\n	</p>\r\n</div>");
$templateCache.put("icsm/contributors/contributors.html","<span class=\"contributors\" ng-mouseenter=\"over()\" ng-mouseleave=\"out()\"\r\n      ng-class=\"(contributors.show || contributors.ingroup || contributors.stick) ? \'transitioned-down\' : \'transitioned-up\'\">\r\n   <button class=\"undecorated contributors-unstick\" ng-click=\"unstick()\" style=\"float:right\">X</button>\r\n   <div ng-repeat=\"contributor in contributors.orgs | activeContributors\" style=\"text-align:cnter\">\r\n      <a ng-href=\"{{contributor.href}}\" name=\"contributors{{$index}}\" title=\"{{contributor.title}}\" target=\"_blank\">\r\n         <img ng-src=\"{{contributor.image}}\" alt=\"{{contributor.title}}\" class=\"elvis-logo\" ng-class=\"contributor.class\"></img>\r\n      </a>\r\n   </div>\r\n</span>");
$templateCache.put("icsm/contributors/show.html","<a ng-mouseenter=\"over()\" ng-mouseleave=\"out()\" class=\"contributors-link\" title=\"Click to lock/unlock contributors list.\"\r\n      ng-click=\"toggleStick()\" href=\"#contributors0\">Contributors</a>");
$templateCache.put("icsm/glossary/glossary.html","<div ng-controller=\"GlossaryCtrl as glossary\">\r\n   <div style=\"position:relative;padding:5px;padding-left:10px;\">\r\n      <div class=\"panel\" style=\"padding:5px;\">\r\n         <p style=\"text-align: left; margin: 10px; font-size: 14px;\">\r\n	         <strong>Glossary</strong>\r\n         </p>\r\n\r\n         <div class=\"panel-body\">\r\n            <table class=\"table table-striped\">\r\n               <thead>\r\n                  <tr>\r\n                     <th>Term</th>\r\n                     <th>Definition</th>\r\n                  </tr>\r\n               </thead>\r\n               <tbody>\r\n                  <tr ng-repeat=\"term in glossary.terms\">\r\n                     <td>{{term.term}}</td>\r\n                     <td>{{term.definition}}</td>\r\n                  </tr>\r\n               </tbody>\r\n            </table>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("icsm/help/faqs.html","<p style=\"text-align: left; margin: 10px; font-size: 14px;\">\r\n   <strong>FAQS</strong>\r\n</p>\r\n\r\n<h5 ng-repeat=\"faq in faqs\"><button type=\"button\" class=\"undecorated\" ng-click=\"focus(faq.key)\">{{faq.question}}</button></h5>\r\n<hr/>\r\n<div class=\"row\" ng-repeat=\"faq in faqs\">\r\n   <div class=\"col-md-12\">\r\n      <h5 tabindex=\"0\" id=\"faqs_{{faq.key}}\">{{faq.question}}</h5>\r\n      <span ng-bind-html=\"faq.answer\"></span>\r\n      <hr/>\r\n   </div>\r\n</div>");
$templateCache.put("icsm/help/help.html","<p style=\"text-align: left; margin: 10px; font-size: 14px;\">\r\n	<strong>Help</strong>\r\n</p>\r\n\r\n<div class=\"panel-body\" ng-controller=\"HelpCtrl as help\">\r\n	The steps to get data!\r\n	<ol>\r\n		<li>Define area of interest</li>\r\n		<li>Select datasets</li>\r\n		<li>Confirm selections</li>\r\n		<li>Enter email address</li>\r\n		<li>Start extract</li>\r\n	</ol>\r\n	An email will be sent to you on completion of the data extract with a link to your data.\r\n   <hr>\r\n	<icsm-faqs faqs=\"help.faqs\" ></icsm-faqs>\r\n</div>");
$templateCache.put("icsm/header/header.html","<div class=\"container-full common-header\" style=\"padding-right:10px; padding-left:10px\">\r\n    <div class=\"navbar-collapse collapse ga-header-collapse\">\r\n        <ul class=\"nav navbar-nav\">\r\n            <li class=\"hidden-xs\"><a href=\"/\"><h1 class=\"applicationTitle\">{{heading}}</h1></a></li>\r\n        </ul>\r\n        <ul class=\"nav navbar-nav navbar-right nav-icons\">\r\n        	<li role=\"menuitem\" style=\"padding-right:10px;position: relative;top: -3px;\">\r\n              <span class=\"altthemes-container\">\r\n	               <span>\r\n                     <a title=\"Location INformation Knowledge platform (LINK)\" href=\"http://fsdf.org.au/\" target=\"_blank\">\r\n                        <img alt=\"FSDF\" src=\"icsm/resources/img/FSDFimagev4.0.png\" style=\"height: 66px\">\r\n                     </a>\r\n                  </span>\r\n               </span>\r\n           </li>\r\n        	<li common-navigation role=\"menuitem\" current=\"current\" style=\"padding-right:10px\"></li>\r\n			<li mars-version-display role=\"menuitem\"></li>\r\n			<li style=\"width:10px\"></li>\r\n        </ul>\r\n    </div><!--/.nav-collapse -->\r\n</div>\r\n<div class=\"contributorsLink\" style=\"position: absolute; right:7px; bottom:15px\">\r\n      <icsm-contributors-link></icsm-contributors-link>\r\n</div>\r\n<!-- Strap -->\r\n<div class=\"row\">\r\n    <div class=\"col-md-12\">\r\n        <div class=\"strap-blue\">\r\n        </div>\r\n        <div class=\"strap-white\">\r\n        </div>\r\n        <div class=\"strap-red\">\r\n        </div>\r\n    </div>\r\n</div>");
$templateCache.put("icsm/panes/panes.html","<div class=\"mapContainer\" class=\"col-md-12\" style=\"padding-right:0\"  ng-attr-style=\"right:{{right.width}}\">\r\n   <span common-baselayer-control class=\"baselayer-slider\" max-zoom=\"16\" title=\"Satellite to Topography bias on base map.\"></span>\r\n   <div class=\"panesMapContainer\" geo-map configuration=\"data.map\">\r\n      <geo-extent></geo-extent>\r\n      <common-feature-info></common-feature-info>\r\n      <icsm-layerswitch></icsm-layerswitch>\r\n   </div>\r\n   <div class=\"base-layer-controller\">\r\n      <div geo-draw data=\"data.map.drawOptions\" line-event=\"elevation.plot.data\" rectangle-event=\"bounds.drawn\"></div>\r\n   </div>\r\n   <restrict-pan bounds=\"data.map.position.bounds\"></restrict-pan>\r\n</div>");
$templateCache.put("icsm/panes/tabs.html","<!-- tabs go here -->\r\n<div id=\"panesTabsContainer\" class=\"paneRotateTabs\" style=\"opacity:0.9\" ng-style=\"{\'right\' : contentLeft +\'px\'}\">\r\n\r\n   <div class=\"paneTabItem\" style=\"width:60px; opacity:0\">\r\n\r\n   </div>\r\n   <div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'download\'}\" ng-click=\"setView(\'download\')\">\r\n      <button class=\"undecorated\">Datasets Download</button>\r\n   </div>\r\n   <!--\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'search\'}\" ng-click=\"setView(\'search\')\">\r\n		<button class=\"undecorated\">Search</button>\r\n	</div>\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'maps\'}\" ng-click=\"setView(\'maps\')\">\r\n		<button class=\"undecorated\">Layers</button>\r\n	</div>\r\n   -->\r\n   <div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'downloader\'}\" ng-click=\"setView(\'downloader\')\">\r\n      <button class=\"undecorated\">Products Download</button>\r\n   </div>\r\n   <div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'glossary\'}\" ng-click=\"setView(\'glossary\')\">\r\n      <button class=\"undecorated\">Glossary</button>\r\n   </div>\r\n   <div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'help\'}\" ng-click=\"setView(\'help\')\">\r\n      <button class=\"undecorated\">Help</button>\r\n   </div>\r\n</div>");
$templateCache.put("icsm/message/message.html","<div class=\"well well-sm mess-container\" ng-show=\"message.type && message.text\"\r\n   ng-class=\"{\'mess-error\': message.type == \'error\', \'mess-warn\': message.type == \'warn\', \'mess-info\': (message.type == \'info\' || message.type == \'wait\')}\">\r\n   <i class=\"fa fa-spinner fa-spin fa-fw\" aria-hidden=\"true\" ng-if=\"message.type == \'wait\'\"></i>\r\n   <span>{{message.text}}</span>\r\n</div>");
$templateCache.put("icsm/products/download.html","<div class=\"well\" ng-show=\"item.showDownload\">\r\n\r\n   <div class=\"well\">\r\n      <div ng-show=\"processing.validClip\" class=\"product-restrict\">\r\n         <span class=\"product-label\">Bounds:</span> {{processing.clip.xMin|number : 4}}&deg; west, {{processing.clip.yMax|number : 4}}&deg; north, {{processing.clip.xMax|number\r\n         : 4}}&deg; east, {{processing.clip.yMin|number : 4}}&deg; south\r\n\r\n         <div ng-show=\"processing.message\" class=\"product-warning\">\r\n            {{processing.message}}\r\n         </div>\r\n      </div>\r\n      <product-projection processing=\"processing\"></product-projection>\r\n      <br/>\r\n      <product-formats processing=\"processing\"></product-formats>\r\n      <br/>\r\n      <product-email processing=\"processing\"></product-email>\r\n   </div>\r\n   <product-download-submit processing=\"processing\" item=\"item\"></product-download-submit>\r\n</div>");
$templateCache.put("icsm/products/email.html","<div class=\"input-group\">\r\n      <span class=\"input-group-addon\" id=\"nedf-email\">Email</span>\r\n      <input required=\"required\" type=\"email\" ng-model=\"processing.email\" class=\"form-control\" placeholder=\"Email address to send download link\">\r\n   </div>\r\n");
$templateCache.put("icsm/products/formats.html","<div class=\"row\">\r\n      <div class=\"col-md-4\">\r\n         <label for=\"geoprocessOutputFormat\">\r\n                  Output Format\r\n               </label>\r\n      </div>\r\n      <div class=\"col-md-8\">\r\n         <select id=\"geoprocessOutputFormat\" style=\"width:95%\" ng-model=\"processing.outFormat\" ng-options=\"opt.value for opt in config.outFormat track by opt.code\"></select>\r\n      </div>\r\n   </div>");
$templateCache.put("icsm/products/projection.html","<div class=\"row\">\r\n   <div class=\"col-md-4\">\r\n      <label for=\"geoprocessOutCoordSys\">\r\n                  Coordinate System\r\n               </label>\r\n   </div>\r\n   <div class=\"col-md-8\">\r\n      <select id=\"geoprocessOutCoordSys\" style=\"width:95%\" ng-model=\"processing.outCoordSys\" ng-options=\"opt.value for opt in config.outCoordSys | productIntersect : processing.clip track by opt.code\"></select>\r\n   </div>\r\n</div>");
$templateCache.put("icsm/products/submit.html","<div class=\"well\" style=\"padding-bottom:2px\">\r\n   <div class=\"row\">\r\n      <div class=\"col-md-6\" style=\"padding-top:7px\">\r\n         <div class=\"progress\">\r\n            <div class=\"progress-bar\" role=\"progressbar\" aria-valuenow=\"{{processing.percentComplete}}\" aria-valuemin=\"0\" aria-valuemax=\"100\"\r\n               style=\"width: {{processing.percentComplete}}%;\">\r\n               <span class=\"sr-only\">60% Complete</span>\r\n            </div>\r\n         </div>\r\n      </div>\r\n      <div class=\"col-md-4\" style=\"padding-top:7px\">\r\n         <span style=\"padding-right:10px\" uib-tooltip=\"Draw a valid area to extract data.\" tooltip-placement=\"left\">\r\n            <i class=\"fa fa-scissors fa-2x\" ng-class=\"{\'product-valid\': processing.validClipSize, \'product-invalid\': !processing.validClipSize }\"></i>\r\n         </span>\r\n         <span style=\"padding-right:10px\" uib-tooltip=\"Select a valid coordinate system for area.\" tooltip-placement=\"left\">\r\n            <i class=\"fa fa-file-video-o fa-2x\" ng-class=\"{\'product-valid\': processing.validProjection, \'product-invalid\': !processing.validProjection}\"></i>\r\n         </span>\r\n         <span style=\"padding-right:10px\" uib-tooltip=\"Select a valid download format.\" tooltip-placement=\"left\">\r\n            <i class=\"fa fa-files-o fa-2x\" ng-class=\"{\'product-valid\': processing.validFormat, \'product-invalid\': !processing.validFormat}\"></i>\r\n         </span>\r\n         <span style=\"padding-right:10px\" uib-tooltip=\"Provide an email address.\" tooltip-placement=\"left\">\r\n            <i class=\"fa fa-envelope fa-2x\" ng-class=\"{\'product-valid\': processing.validEmail, \'product-invalid\': !processing.validEmail}\"></i>\r\n         </span>\r\n      </div>\r\n      <div class=\"col-md-2\">\r\n         <button class=\"btn btn-primary pull-right\" ng-disabled=\"!processing.valid\" ng-click=\"submit()\">Submit</button>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("icsm/results/abstractbutton.html","<button ng-show=\"show\" type=\"button\" class=\"undecorated\" title=\"View full title and abstract of this dataset\" ng-click=\"toggle()\">\r\n	<i class=\"fa fa-lg\" ng-class=\"{\'fa-caret-down active\':item.showAbstract, \'fa-caret-right\':!item.showAbstract}\"></i>\r\n</button>");
$templateCache.put("icsm/results/abstracttooltip.html","<div>\r\n{{item.metadata.title? item.metadata.title: \'Loading...\'}}\r\n</div>");
$templateCache.put("icsm/results/continue.html","<div class=\"continue-container\" ng-show=\"ctrl.selected.length\">\r\n   <button class=\"btn btn-primary\" ng-click=\"ctrl.review()\">Download {{ctrl.selected.length | number}} selected datasets... (Approx: {{ctrl.selectedSize | fileSize}})</button>\r\n</div>\r\n\r\n");
$templateCache.put("icsm/results/orgheading.html","<h5>\r\n   <img ng-src=\"{{mappings[org.source].image}}\" ng-attr-style=\"height:{{mappings[org.source].height}}px\"></img>\r\n      <strong>{{org.source}}</strong> (Showing {{org.downloadables | countMatchedDownloadables | number:0}} of {{org.downloadables	| countDownloadables | number:0}})\r\n</h5>");
$templateCache.put("icsm/results/results.html","<div ng-show=\"!list || !list.length\">\r\n   <div class=\"alert alert-warning\" role=\"alert\">\r\n      <strong>Select an area</strong> to find datasets within.</div>\r\n</div>\r\n\r\n<div ng-show=\"list.length\" class=\"results-list\">\r\n   <div class=\"row\">\r\n      <div class=\"col-md-12\" uib-tooltip=\"Number of intersecting or very near datasets to your area of interest.\">\r\n         <h4 style=\"display:inline-block; padding-left:7px\">Found {{products.length | number:0}} datasets</h4>\r\n      </div>\r\n   </div>\r\n   <div class=\"panel panel-default\" style=\"margin-bottom: 5px; margin-top: 0;\">\r\n      <div class=\"panel-body\" style=\"float:clear\">\r\n         <span class=\"filter-text\" style=\"float:left;width:50%\">\r\n            <div class=\"input-group input-group-sm\">\r\n               <span class=\"input-group-addon\" id=\"names1\">Filter:</span>\r\n               <input type=\"text\" ng-model=\"filters.filter\" class=\"form-control\" ng-change=\"update()\" placeholder=\"Filter names\" aria-describedby=\"names1\">\r\n            </div>\r\n         </span>\r\n         <span class=\"filter-type\" style=\"padding:10px; float:right\">\r\n            <span class=\"listTypeLabel\">Filter by type:</span>\r\n            <span ng-repeat=\"type in filters.types\" class=\"listType\">\r\n               <input type=\"checkbox\" ng-model=\"type.selected\" ng-change=\"update()\" />\r\n               <span uib-tooltip=\"{{type.description}}\">{{type.label}}</span>\r\n            </span>\r\n         </span>\r\n      </div>\r\n   </div>\r\n\r\n   <div ng-repeat=\"available in list\" class=\"well\" style=\"padding-left:4px;padding-right:4px\" ng-show=\"list.someMatches(available)\"\r\n      ng-controller=\"listCtrl as list\">\r\n      <icsm-org-heading org=\"available\" mappings=\"mappings\"></icsm-org-heading>\r\n      <div>\r\n         <div class=\"listRow\" ng-class-odd=\"\'listEven\'\" ng-repeat=\"(typeKey, types) in available.downloadables | allowedTypes\" ng-show=\"types | hasTypeMatches\">\r\n            <span>\r\n               <h5>{{typeKey}}</h5>\r\n            </span>\r\n\r\n            <div ng-if=\"typeKey === \'Unreleased Data\'\">\r\n               <icsm-unreleased types=\"types\">\r\n            </div>\r\n            <div ng-if=\"typeKey !== \'Unreleased Data\'\">\r\n               <div ng-repeat=\"(key, items) in types\" ng-show=\"(items | countMatchedItems) != 0\">\r\n                  <div>\r\n                     <h5>\r\n                        <button ng-click=\"list.checkChildren(items)\" style=\"width:7em\" class=\"btn btn-xs btn-default\">\r\n                           <span ng-show=\"!list.childrenChecked(items)\">Select all</span>\r\n                           <span ng-show=\"list.childrenChecked(items)\">Deselect all</span>\r\n                        </button>\r\n                        <span uib-tooltip=\"{{filter.types[key].description}}\">{{key}} (Showing {{items | countMatchedItems | number:0}} of {{items.length | number:0}})</span>\r\n\r\n\r\n                        <button class=\"pull-right undecorated\" ng-click=\"expansions[available.source + \'_\' + key] = !expansions[available.source + \'_\' + key]\">\r\n                           [{{expansions[available.source + \'_\' + key]?\"hide \":\"show \"}} list]\r\n                        </button>\r\n                     </h5>\r\n                  </div>\r\n                  <div ng-show=\"expansions[available.source + \'_\' + key]\">\r\n                     <subtype items=\"items\" mappings=\"mappings\" show=\"show\" hide=\"hide\"></subtype>\r\n                     <div style=\"text-align:right\">\r\n                        <button class=\"undecorated\" ng-click=\"expansions[available.source + \'_\' + key] = false\">[hide list]</button>\r\n                     </div>\r\n                  </div>\r\n               </div>\r\n            </div>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("icsm/results/subtype.html","<div ng-show=\"(items | matchedItems).length > paging.pageSize\"\r\n   paging page=\"paging.page\" page-size=\"paging.pageSize\"\r\n   total=\"(items | matchedItems).length\"\r\n   paging-action=\"setPage(page, pageSize)\">\r\n</div>\r\n<div>\r\n   <div ng-repeat=\"item in data\" icsm-abstract-hover item=\"item\">\r\n      <div tooltip-append-to-body=\"true\" uib-tooltip-template=\"\'icsm/results/abstracttooltip.html\'\" tooltip-popup-delay=\"400\" data-ng-mouseenter=\"show(item)\"\r\n         data-ng-mouseleave=\"hide(item)\">\r\n         <input type=\"checkbox\" ng-model=\"item.selected\" />\r\n         <icsm-abstract item=\"item\"></icsm-abstract>\r\n         <common-cc version=\"mappings[item.source].ccLicence\"></common-cc>\r\n         <span class=\"listItem\" item=\"item\" icsm-abstract-link></span>\r\n         <span ng-show=\"item.file_size\" style=\"float:right;padding-top:3px\">({{item.file_size | fileSize}})</span>\r\n         <span ng-show=\"item.product\" style=\"float:right;padding-top:3px\" title=\"Product size will depend on size of chosen area, data coverage and resolution. An email will be sent after the extraction giving the exact size of the extracted data and a link to the product.\">(Product &lt; 500MB)</span>\r\n      </div>\r\n      <div ng-show=\"item.showAbstract\" class=\"well\">\r\n         <span ng-show=\"!item.metadata\">\r\n            <i class=\"fa fa-spinner fa-spin fa-lg fa-fw\"></i>\r\n            <span>Loading metadata...</span>\r\n         </span>\r\n         <div ng-show=\"item.metadata.abstract\">\r\n            <strong>{{item.metadata.title}}</strong> -\r\n            <span class=\"icsm-abstract-body\" ng-bind-html=\"item.metadata.abstractText\"></span>\r\n         </div>\r\n         <div ng-show=\"!item.metadata.abstract\">\r\n            <i class=\"fa fa-lg fa-exclamation-triangle\" style=\"color:orange\"></i>\r\n            There is no abstract available for this dataset.\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("icsm/results/unreleased.html","<div ng-repeat=\"(key, items) in types\" ng-show=\"(items | countMatchedItems) != 0\">\r\n   <div style=\"padding-left:8px\">\r\n      <h5>\r\n         <span uib-tooltip=\"{{filter.types[key].description}}\">{{key}} (Showing {{items | countMatchedItems | number:0}} of {{items.length | number:0}})</span>\r\n\r\n         <button class=\"pull-right undecorated\" ng-click=\"expansions[\'unreleased_\' + items[0].source + \'_\' + key] = !expansions[\'unreleased_\' + items[0].source + \'_\' + key]\">\r\n            [{{expansions[\'unreleased_\' + items[0].source + \'_\' + key]?\"hide \":\"show \"}} list]\r\n         </button>\r\n      </h5>\r\n   </div>\r\n   <div ng-show=\"expansions[\'unreleased_\' + items[0].source + \'_\' + key]\">\r\n      <div ng-repeat=\"item in items | matchedItems\" icsm-abstract-hover item=\"item\">\r\n         <div tooltip-append-to-body=\"true\" uib-tooltip-template=\"\'icsm/results/abstracttooltip.html\'\" tooltip-popup-delay=\"400\" data-ng-mouseenter=\"show(item)\"\r\n            data-ng-mouseleave=\"hide(item)\" style=\"padding-left:8px;\">\r\n            <icsm-abstract item=\"item\"></icsm-abstract>\r\n            <button type=\"button\" class=\"undecorated\" disabled=\"disabled\" title=\"Licence details pending release.\">\r\n               <i class=\"fa fa-lg fa-gavel\"></i>\r\n            </button>\r\n            <span class=\"listItem\" name=\"project_name\" item=\"item\" icsm-abstract-link></span>\r\n            <span ng-show=\"item.file_size\" style=\"float:right;padding-top:3px\">({{item.file_size | fileSize}})</span>\r\n         </div>\r\n         <div ng-show=\"item.showAbstract\" class=\"well\" style=\"margin-bottom:0px\">\r\n            <span ng-show=\"!item.metadata\">\r\n               <i class=\"fa fa-spinner fa-spin fa-lg fa-fw\"></i>\r\n               <span>Loading metadata...</span>\r\n            </span>\r\n            <div ng-show=\"item.metadata.abstract\">\r\n               <strong>{{item.metadata.title}}</strong> -\r\n               <span class=\"icsm-abstract-body\" ng-bind-html=\"item.metadata.abstractText\"></span>\r\n            </div>\r\n            <div ng-show=\"!item.metadata.abstract\">\r\n               <i class=\"fa fa-lg fa-exclamation-triangle\" style=\"color:orange\"></i>\r\n               There is no abstract available for this dataset.\r\n            </div>\r\n         </div>\r\n         <div style=\"padding-left:12px\">\r\n            <div>\r\n               <strong style=\"width:7em\">Captured: </strong>{{item.captured | captured}}\r\n            </div>\r\n            <div ng-if=\"item.available_date\">\r\n               <strong style=\"width:7em\">Available: </strong>{{item.available_date | reverseDate}}\r\n            </div>\r\n            <div>\r\n               <strong style=\"width:7em\">Contact: </strong>\r\n               <a href=\"mailTo:{{item.contact}}\">{{item.contact}}</a>\r\n            </div>\r\n         </div>\r\n      </div>\r\n\r\n      <div style=\"text-align:right\">\r\n         <button class=\"undecorated\" ng-click=\"expansions[\'unreleased_\' + items[0].source + \'_\' + key] = false\">[hide list]</button>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("icsm/reviewing/reviewing.html","<div class=\"modal-header\">\r\n   <h3 class=\"modal-title splash\">Download datasets by providing email address and start extract</h3>\r\n</div>\r\n<div class=\"modal-body\" id=\"accept\" ng-form exp-enter=\"accept()\" icsm-splash-modal style=\"width: 100%; margin-left: auto; margin-right: auto;\">\r\n   <div class=\"row bg-warning\" ng-show=\"noneSelected(products)\">\r\n      <div class=\"col-md-2\">\r\n         <button type=\"button\" style=\"float:right\" class=\"btn btn-primary\" ng-click=\"cancel()\">Close</button>\r\n      </div>\r\n   </div>\r\n   <div ng-controller=\"listCtrl as list\">\r\n      <div class=\"row\">\r\n         <div class=\"col-md-12\">\r\n            <strong>\r\n               {{list.selected.length}} Selected Datasets\r\n               <span ng-show=\"list.selectedSize\">(Approx: {{list.selectedSize | fileSize}})</span>\r\n            </strong>\r\n         </div>\r\n      </div>\r\n   </div>\r\n   <div ng-repeat=\"org in products\">\r\n      <h5>\r\n         <img ng-src=\"{{mappings[org.source].image}}\" ng-attr-style=\"height:{{mappings[org.source].height}}px\"></img>\r\n         <strong>{{org.source}}</strong>\r\n      </h5>\r\n      <div style=\"padding-left:10px\" ng-repeat=\"(key, subGroup) in org.downloadables\">\r\n         <h5>{{key}}</h5>\r\n         <div style=\"padding-left:10px;\" ng-repeat=\"(name, items) in subGroup\">\r\n            <h5 title=\"Clipped product using coordinate System: {{data.outCoordSys.value}}, Output Format: {{data.outFormat.value}}\">\r\n               {{name}}\r\n               <span style=\"padding-left:25px;font-size:90%\">\r\n                  {{items.length | number :0}} items\r\n                  <span ng-if=\"items | hasProducts\">{{items | productsSummary}}</span>\r\n                  totalling {{items | reviewSumSize | fileSize}}</span>\r\n            </h5>\r\n         </div>\r\n      </div>\r\n\r\n   </div>\r\n\r\n   <div ng-controller=\"listCtrl as list\">\r\n      <div ng-if=\"list.selected | hasProducts\" class=\"well\" style=\"padding:7px\">\r\n         <h5 style=\"margin-top:4px\">{{list.selected | productsCount}} items are products which you can elect to transform into a different coordinate system and file format</h5>\r\n         <span products-dialog>\r\n            <product-projection processing=\"data\"></product-projection>\r\n            <product-formats processing=\"data\"></product-formats>\r\n         </span>\r\n      </div>\r\n   </div>\r\n\r\n   <div class=\"row reviewing-divider\">\r\n      <div class=\"col-md-12\">\r\n         <div review-email></div>\r\n      </div>\r\n   </div>\r\n   <div class=\"row\" ng-controller=\"listCtrl as list\">\r\n      <div class=\"col-md-8\">\r\n         <strong>Email notification</strong> The extract of data can take some time. By providing an email address we will be able\r\n         to notify you when the job is complete. The email will provide a link to the extracted data which will be packaged\r\n         up as a single compressed file.\r\n      </div>\r\n      <div class=\"col-md-4\">\r\n         <div class=\"pull-right\" style=\"padding:8px;\">\r\n            <button type=\"button\" class=\"btn btn-primary\" ng-click=\"accept()\" ng-disabled=\"!data.email || !list.selected.length\">Start extract of datasets\r\n            </button>\r\n            <button type=\"button\" class=\"btn btn-primary\" ng-click=\"cancel()\">Cancel</button>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("icsm/side-panel/side-panel-left.html","<div class=\"cbp-spmenu cbp-spmenu-vertical cbp-spmenu-left\" style=\"width: {{left.width}}px;\" ng-class=\"{\'cbp-spmenu-open\': left.active}\">\r\n    <a href=\"\" title=\"Close panel\" ng-click=\"closeLeft()\" style=\"z-index: 1200\">\r\n        <span class=\"glyphicon glyphicon-chevron-left pull-right\"></span>\r\n    </a>\r\n    <div ng-show=\"left.active === \'legend\'\" class=\"left-side-menu-container\">\r\n        <legend url=\"\'img/AustralianTopogaphyLegend.png\'\" title=\"\'Map Legend\'\"></legend>\r\n    </div>\r\n</div>");
$templateCache.put("icsm/side-panel/side-panel-right.html","<div class=\"cbp-spmenu cbp-spmenu-vertical cbp-spmenu-right noPrint\" ng-attr-style=\"width:{{right.width}}\" ng-class=\"{\'cbp-spmenu-open\': right.active}\">\r\n    <a href=\"\" title=\"Close panel\" ng-click=\"closePanel()\" style=\"z-index: 1\">\r\n        <span class=\"glyphicon glyphicon-chevron-right pull-left\"></span>\r\n    </a>\r\n\r\n    <div class=\"right-side-menu-container\" ng-show=\"right.active === \'download\'\" icsm-view></div>\r\n    <div class=\"right-side-menu-container\" ng-show=\"right.active === \'maps\'\" icsm-maps></div>\r\n    <div class=\"right-side-menu-container\" ng-show=\"right.active === \'glossary\'\" icsm-glossary></div>\r\n    <div class=\"right-side-menu-container\" ng-show=\"right.active === \'help\'\" icsm-help></div>\r\n    <panel-close-on-event only-on=\"search\" event-name=\"clear.button.fired\"></panel-close-on-event>\r\n</div>\r\n");
$templateCache.put("icsm/select/doc.html","<div ng-class-odd=\"\'odd\'\" ng-class-even=\"\'even\'\" ng-mouseleave=\"select.lolight(doc)\" ng-mouseenter=\"select.hilight(doc)\">\r\n	<span ng-class=\"{ellipsis:!expanded}\" tooltip-enable=\"!expanded\" style=\"width:100%;display:inline-block;\"\r\n			tooltip-class=\"selectAbstractTooltip\" tooltip=\"{{doc.abstract | truncate : 250}}\" tooltip-placement=\"bottom\">\r\n		<button type=\"button\" class=\"undecorated\" ng-click=\"expanded = !expanded\" title=\"Click to see more about this dataset\">\r\n			<i class=\"fa pad-right fa-lg\" ng-class=\"{\'fa-caret-down\':expanded,\'fa-caret-right\':(!expanded)}\"></i>\r\n		</button>\r\n		<download-add item=\"doc\" group=\"group\"></download-add>\r\n		<icsm-wms data=\"doc\"></icsm-wms>\r\n		<icsm-bbox data=\"doc\" ng-if=\"doc.showExtent\"></icsm-bbox>\r\n		<a href=\"https://ecat.ga.gov.au/geonetwork/srv/eng/search#!{{doc.primaryId}}\" target=\"_blank\" ><strong>{{doc.title}}</strong></a>\r\n	</span>\r\n	<span ng-class=\"{ellipsis:!expanded}\" style=\"width:100%;display:inline-block;padding-right:15px;\">\r\n		{{doc.abstract}}\r\n	</span>\r\n	<div ng-show=\"expanded\" style=\"padding-bottom: 5px;\">\r\n		<h5>Keywords</h5>\r\n		<div>\r\n			<span class=\"badge\" ng-repeat=\"keyword in doc.keywords track by $index\">{{keyword}}</span>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/select/group.html","<div class=\"panel panel-default\" style=\"margin-bottom:-5px;\" >\r\n	<div class=\"panel-heading\"><icsm-wms data=\"group\"></icsm-wms> <strong>{{group.title}}</strong></div>\r\n	<div class=\"panel-body\">\r\n   		<div ng-repeat=\"doc in group.docs\">\r\n   			<div select-doc doc=\"doc\" group=\"group\"></div>\r\n		</div>\r\n	</div>\r\n</div>\r\n");
$templateCache.put("icsm/select/select.html","<div>\r\n	<div style=\"position:relative;padding:5px;padding-left:10px;\" ng-controller=\"SelectCtrl as select\" class=\"scrollPanel\">\r\n		<div class=\"panel panel-default\" style=\"margin-bottom:-5px\">\r\n  			<div class=\"panel-heading\">\r\n  				<h3 class=\"panel-title\">Available datasets</h3>\r\n  			</div>\r\n  			<div class=\"panel-body\">\r\n				<div ng-repeat=\"doc in select.data.response.docs\" style=\"padding-bottom:7px\">\r\n					<div select-doc ng-if=\"doc.type == \'dataset\'\" doc=\"doc\"></div>\r\n					<select-group ng-if=\"doc.type == \'group\'\" group=\"doc\"></select-group>\r\n				</div>\r\n  			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/splash/splash.html","<div class=\"modal-header\">\r\n   <h3 class=\"modal-title splash\">Elevation - Foundation Spatial Data</h3>\r\n</div>\r\n<div class=\"modal-body\" id=\"accept\" ng-form exp-enter=\"accept()\" icsm-splash-modal style=\"width: 100%; margin-left: auto; margin-right: auto;\">\r\n	<div>\r\n		<p>\r\n			Here you can download point cloud and elevation datasets sourced from jurisdictions.\r\n		</p>\r\n		<p>\r\n			<a href=\"http://www.ga.gov.au/topographic-mapping/digital-elevation-data.html\" target=\"_blank\">Find out more on our Elevation page.</a>\r\n		</p>\r\n		<p>\r\n			Data can be downloaded at <strong>no charge</strong> and there is no limit to how many (please check the file size before you download your files).\r\n		</p>\r\n		<p>\r\n			<a href=\"http://opentopo.sdsc.edu/gridsphere/gridsphere?cid=contributeframeportlet&gs_action=listTools\" target=\"_blank\">Click here for Free GIS Tools.</a>\r\n		</p>\r\n      <h5>How to use</h5>\r\n      <p>\r\n         <ul>\r\n            <li>Pan and zoom the map to your area of interest,</li>\r\n            <li>Click on the \"Select an area...\" button to enable drawing,</li>\r\n            <li>Click on the map, holding the button down,</li>\r\n            <li>Drag to a diagonal corner (not too big, there is a limit of roughly 2 square degrees or 200 square km))</li>\r\n            <li>On release we will check for data within or very near your area of interest</li>\r\n            <li>If the list is large you can filter:\r\n               <ul>\r\n                  <li>Partial text match by typing in the filter field and/or</li>\r\n                  <li>You can restrict the display to either elevation (DEM) or point cloud file types</li>\r\n               </ul>\r\n            </li>\r\n            <li>Check against any file you would like to download. To reiterate, these files can be huge so take note of the file size before downloading</li>\r\n            <li>Review your selected datasets and submit.</li>\r\n            <li>An email will be sent to you with a link to all your data, zipped into a single file.</li>\r\n            <li>These files can be huge so take note of the file size before submitting or downloading</li>\r\n         </ul>\r\n      </p>\r\n      <h5>Hints</h5>\r\n      <p>\r\n         <ul>\r\n            <li>Hovering over many items will give you further information about the purpose of the item</li>\r\n            <li>Drawing a polyline allows you to measure distance along the polyline.</li>\r\n            <li>On completion on drawing a line the elevation along that line is plotted.</li>\r\n            <li>While the tool to draw your area of interest is enabled it is easiest to pan the map using the arrow keys.</li>\r\n            <li>There are many areas where there is no data though the coverage is improving all the time.</li\r\n         </ul>\r\n      </p>\r\n	</div>\r\n   <div style=\"padding:30px; padding-top:0; padding-bottom:40px; width:100%\">\r\n		<div class=\"pull-right\">\r\n		  	<button type=\"button\" class=\"btn btn-primary\" ng-model=\"seenSplash\" ng-click=\"accept()\" autofocus>Continue</button>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/themes/themes.html","<div class=\"dropdown themesdropdown\">\r\n  <button class=\"btn btn-default dropdown-toggle themescurrent\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">\r\n    Theme\r\n    <span class=\"caret\"></span>\r\n  </button>\r\n  <ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\">\r\n    <li ng-repeat=\"item in themes\">\r\n       <a href=\"#\" title=\"{{item.title}}\" ng-href=\"{{item.url}}\" class=\"themesItemCompact\">\r\n         <span class=\"icsm-icon\" ng-class=\"item.className\"></span>\r\n         <strong style=\"vertical-align:top;font-size:110%\">{{item.label}}</strong>\r\n       </a>\r\n    </li>\r\n  </ul>\r\n</div>");
$templateCache.put("icsm/toolbar/toolbar.html","<div class=\"elevation-toolbar noPrint\">\r\n   <div class=\"toolBarContainer\">\r\n       <div>\r\n           <ul class=\"left-toolbar-items\"></ul>\r\n           <ul class=\"right-toolbar-items\">\r\n               <li>\r\n                   <panel-trigger panel-id=\"download\" panel-width=\"590px\" name=\"Download\" default=\"default\" icon-class=\"fa-list\" title=\"Select an area of interest and select datasets for download\"></panel-trigger>\r\n               </li>\r\n               <li>\r\n                 <panel-trigger panel-id=\"help\" panel-width=\"590px\" name=\"Help\" icon-class=\"fa-question-circle-o\" title=\"Show help\"></panel-trigger>\r\n              </li>\r\n              <li>\r\n                <panel-trigger panel-id=\"glossary\" panel-width=\"590px\" name=\"Glossary\" icon-class=\"fa-book\" title=\"Show glossary\"></panel-trigger>\r\n             </li>\r\n               <li reset-page></li>\r\n           </ul>\r\n       </div>\r\n   </div>\r\n</div>");
$templateCache.put("icsm/view/view.html","<div class=\"container-fluid downloadPane\">\r\n   <icsm-clip data=\"data.item\"></icsm-clip>\r\n   <div class=\"list-container\">\r\n      <icsm-list></icsm-list>\r\n   </div>\r\n   <div class=\"downloadCont\" icsm-search-continue></div>\r\n</div>");}]);