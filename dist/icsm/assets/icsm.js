(function(angular) {

'use strict';

angular.module("IcsmApp", [
	 	'common.altthemes',
	 	'common.header',
      'common.navigation',
      'common.templates',
	 	'common.toolbar',

      'explorer.config',
      'explorer.confirm',
	 	'explorer.drag',
	 	'explorer.enter',
      'explorer.flasher',
      'explorer.googleanalytics',
	 	'explorer.httpdata',
	 	'explorer.info',
      'explorer.legend',
      'explorer.message',
	 	'explorer.modal',
	 	'explorer.persist',
	 	'explorer.projects',
	 	'explorer.tabs',
	 	'explorer.version',
	 	'exp.ui.templates',
	 	'explorer.map.templates',

	 	'ui.bootstrap',
	 	'ui.bootstrap-slider',
      'ngAutocomplete',
	 	'ngRoute',
	 	'ngSanitize',
	 	'page.footer',

	 	'geo.baselayer.control',
	 	'geo.draw',
	 	// 'geo.elevation',
	 	//'icsm.elevation',
	 	//'geo.extent',
	 	'geo.geosearch',
	 	'geo.map',
	 	'geo.maphelper',
	 	'geo.measure',

	 	'icsm.bounds',
	 	'icsm.clip',
	 	'icsm.glossary',
	 	'icsm.help',
	 	'icsm.list',
      'icsm.mapevents',
	 	'icsm.panes',
	 	'icsm.select',
	 	'icsm.splash',
	 	'icsm.state',
	 	'icsm.templates',
		'icsm.view'
])

// Set up all the service providers here.
.config(['configServiceProvider', 'persistServiceProvider', 'projectsServiceProvider', 'versionServiceProvider',
         function(configServiceProvider, persistServiceProvider, projectsServiceProvider, versionServiceProvider) {
	configServiceProvider.location("icsm/resources/config/config.json");
   configServiceProvider.dynamicLocation("icsm/resources/config/appConfig.json?t=");
	versionServiceProvider.url("icsm/assets/package.json");
	persistServiceProvider.handler("local");
	projectsServiceProvider.setProject("icsm");
}])

.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
		when('/administrativeBoundaries', {
			templateUrl : "admin/app/app.html",
			controller : "adminCtrl",
			controllerAs :  "admin"
		}).
		when('/positioning', {
			templateUrl : "positioning/app/app.html",
			controller : "positioningCtrl",
			controllerAs :  "positioning"
		}).
		when('/placeNames', {
			templateUrl : "placenames/app/app.html",
			controller : "placeNamesCtrl",
			controllerAs :  "placeNames"
		}).
		when('/landParcelAndProperty', {
			templateUrl : "landParcelAndProperty/app/app.html",
			controller : "landParcelAndPropertyCtrl",
			controllerAs :  "landParcelAndProperty"
		}).
		when('/imagery', {
			templateUrl : "imagery/app/app.html",
			controller : "imageryCtrl",
			controllerAs :  "imagery"
		}).
		when('/transport', {
			templateUrl : "transport/app/app.html",
			controller : "transportCtrl",
			controllerAs :  "transport"
		}).
		when('/water', {
			templateUrl : "water/app/app.html",
			controller : "waterCtrl",
			controllerAs :  "water"
		}).
		when('/elevationAndDepth', {
			templateUrl : "elevationAndDepth/app/app.html",
			controller : "elevationAndDepthCtrl",
			controllerAs :  "elevationAndDepth"
		}).
		when('/landCover', {
			templateUrl : "landCover/app/app.html",
			controller : "landCoverCtrl",
			controllerAs :  "landCover"
		}).
		when('/icsm', {
			templateUrl : "icsm/app/app.html",
			controller : "icsmCtrl",
			controllerAs :  "icsm"
		}).
		otherwise({
			redirectTo: "/icsm"
		});
}])

.factory("userService", [function() {
	return {
		login : noop,
		hasAcceptedTerms : noop,
		setAcceptedTerms : noop,
		getUsername : function() {
			return "anon";
		}
	};
	function noop() {return true;}
}])

.controller("RootCtrl", RootCtrl);

RootCtrl.$invoke = ['$http', 'configService', 'mapService'];
function RootCtrl($http, configService, mapService) {
	var self = this;
	mapService.getMap().then(function(map) {
		self.map = map;
	});
	configService.getConfig().then(function(data) {
		self.data = data;
		// If its got WebGL its got everything we need.
		try {
			var canvas = document.createElement( 'canvas' );
			data.modern = !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) );
		} catch ( e ) {
			data.modern = false;
		}
	});
}


})(angular);
/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("icsm.clip", ['geo.draw'])

.directive('icsmInfoBbox', function() {
	return {
		restrict: 'AE',
		templateUrl: 'icsm/clip/infobbox.html'
	};
})

.directive("icsmClip", ['$rootScope', '$timeout', 'clipService', 'flashService', 'mapService',
      function($rootScope, $timeout, clipService, flashService, mapService) {
	return {
		templateUrl : "icsm/clip/clip.html",
		scope : {
			bounds : "=",
			trigger : "=",
			drawn : "&"
		},
		link : function(scope, element) {
         var timer;

         scope.clip = {
            xMax: null,
            xMin: null,
            yMax: null,
            yMin: null
         };
			if(typeof scope.showBounds === "undefined") {
				scope.showBounds = false;
			}
         mapService.getMap().then(function(map) {
			   scope.$watch("bounds", function(bounds) {
				   if(bounds && scope.trigger) {
					   $timeout(function() {
						   scope.initiateDraw();
					   });
				   } else if(!bounds) {
					   clipService.cancelDraw();
				   }
            });
            $timeout(function() {
               console.info("start draw");
               scope.initiateDraw();
            },100);
			});

         scope.check = function() {
            $timeout.cancel(timer);
            timer = $timeout(function() {
               $rootScope.$broadcast('icsm.clip.drawn', scope.clip);
            }, 4000);
         };

         $rootScope.$on('icsm.clip.draw', function() {
            scope.initiateDraw();
         });

			scope.initiateDraw = function() {
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
}])


.factory("clipService", ['$q', '$rootScope', 'drawService', function($q, $rootScope, drawService) {
	return {
		initiateDraw : function() {
			return drawService.drawRectangle().then(drawComplete);
		},

		cancelDraw : function() {
			drawService.cancelDrawRectangle();
		}
	};

	function drawComplete(data) {
		return {
         clip:{
			   xMax: data.bounds.getEast().toFixed(5),
			   xMin: data.bounds.getWest().toFixed(5),
			   yMax: data.bounds.getNorth().toFixed(5),
			   yMin: data.bounds.getSouth().toFixed(5)
		   }
      };
	}
}]);


})(angular);
/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("icsm.bounds", [])

.directive('icsmBounds', ['flashService', 'messageService', 'boundsService',
      function(flashService, messageService, boundsService) {
   var flasher;
	return {
		restrict: 'AE',
      link: function() {
         boundsService.init().then(null, null, function notify(message) {
            flashService.remove(flasher);
            switch(message.type) {
               case "error":
               case "warn":
               case "info":
                  messageService[message.type](message.text);
                  break;
               default:
                  flashService.remove(flasher);
                  flasher = flashService.add(message.text, message.duration?message.duration:8000, message.type == "wait");
            }
         });
      }
	};
}])

.factory("boundsService", ['$http', '$q', '$rootScope', '$timeout', 'configService', 'flashService',
         function($http, $q, $rootScope, $timeout, configService, flashService) {
   var clipTimeout, notify;
	return {
		init: function() {
         notify = $q.defer();
         $rootScope.$on('icsm.clip.drawn', function(event, clip) {
            send('Area drawn. Checking for data...');
            checkSize(clip).then(function(message) {
               console.log(message);
               if(message.code == "success") {
                  $rootScope.$broadcast('icsm.bounds.draw', [
                     clip.xMin,
                     clip.yMin,
                     clip.xMax,
                     clip.yMax
                  ]);
                  getList(clip);
               } else {
                  $rootScope.$broadcast('icsm.clip.draw');
               }
            });
         });
         return notify.promise;
		},

		cancelDraw: function() {
			drawService.cancelDrawRectangle();
		}
	};

   function send(message, type, duration) {
      if(notify) {
         notify.notify({
            text: message,
            type: type,
            duration: duration
         });
      }
   }

	function checkSize(clip) {
		var deferred = $q.defer();
      var result = drawn(clip);
		if(result && result.code) {
			switch(result.code) {
				case "oversize":
					$timeout(function() {
                  send("", "clear");
						send("The selected area is too large to process. Please restrict to approximately " +
								"2 degrees square.",
                        "error");
						deferred.resolve(result);
					});
					break;
				case "undersize":
					$timeout(function() {
                  send("", "clear");
						send("X Min and Y Min should be smaller than X Max and Y Max, respectively. " +
                        "Please update the drawn area.", "error");
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
			clip.xMax = clip.xMax === null? null: +clip.xMax;
			clip.xMin = clip.xMin === null? null: +clip.xMin;
			clip.yMax = clip.yMax === null? null: +clip.yMax;
			clip.yMin = clip.yMin === null? null: +clip.yMin;
		}

	function drawn(clip) {
		//geoprocessService.removeClip();
		forceNumbers(clip);

		if(overSizeLimit(clip)) {
			return {code: "oversize"};
		}

		if(underSizeLimit(clip)) {
			return {code: "undersize"};
		}

		if(clip.xMax === null) {
			return {code: "incomplete"};
		}

		if(validClip(clip)) {
			return {code: "success"};
		}
		return {code: "invalid"};
   }

			// The input validator takes care of order and min/max constraints. We just check valid existance.
	function validClip(clip) {
	   return clip &&
		   angular.isNumber(clip.xMax) &&
		   angular.isNumber(clip.xMin) &&
		   angular.isNumber(clip.yMax) &&
		   angular.isNumber(clip.yMin) &&
		   !overSizeLimit(clip) &&
		   !underSizeLimit(clip);
	}

   function getList(clip) {
		configService.getConfig("processing").then(function(conf) {
         var url = conf.intersectsUrl;
			if(url) {
				// Order matches the $watch signature so be careful
				var urlWithParms = url
					.replace("{maxx}", clip.xMax)
					.replace("{minx}", clip.xMin)
					.replace("{maxy}", clip.yMax)
					.replace("{miny}", clip.yMin);

				send("Checking there is data in your selected area...", "wait", 180000);
				$http.get(urlWithParms).then(function(response) {
					if(response.data && response.data.available_data) {
                  var message = "There is no data held in your selected area. Please try another area.";
                  send("", "clear");
						if(response.data.available_data) {
                     response.data.available_data.forEach(function(group) {
                        if(group.downloadables.length) {
                           message = "There is intersecting data. Select downloads from the list.";
                        }
                     });
                  }
                  send(message);
						$rootScope.$broadcast('site.selection', response.data);
					}
				}, function(err) { // If it falls over we don't want to crash.
					send("The service that provides the list of datasets is currently unavailable. " +
                              "Please try again later.", "error");
			   });
         }
		});
   }
}]);



})(angular);
/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("icsm.glossary", [])

.directive("icsmGlossary", [function() {
	return {
		templateUrl : "icsm/glossary/glossary.html"
	};
}])

.controller("GlossaryCtrl", GlossaryCtrl)
.factory("glossaryService", GlossaryService);

GlossaryCtrl.$inject = ['$log', 'glossaryService'];
function GlossaryCtrl($log, glossaryService) {
	var self = this;
	$log.info("GlossaryCtrl");
	glossaryService.getTerms().then(function(terms) {
		self.terms = terms;
	});
}


GlossaryService.$inject = ['$http'];
function GlossaryService($http) {
	var TERMS_SERVICE = "icsm/resources/config/glossary.json";

	return {
		getTerms : function() {
			return $http.get(TERMS_SERVICE, {cache : true}).then(function(response) {
				return response.data;
			});
		}
	};
}

})(angular);
/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("icsm.help", [])

.directive("icsmHelp", [function() {
	return {
		templateUrl : "icsm/help/help.html"
	};
}])

.directive("icsmFaqs", [function() {
	return {
		restrict:"AE",
		templateUrl : "icsm/help/faqs.html",
		scope : {
			faqs : "="
		},
		link : function(scope) {
			scope.focus = function(key) {
				$("#faqs_" + key).focus();
			};
		}
	};
}])

.controller("HelpCtrl", HelpCtrl)
.factory("helpService", HelpService);

HelpCtrl.$inject = ['$log', 'helpService'];
function HelpCtrl($log, helpService) {
	var self = this;
	$log.info("HelpCtrl");
	helpService.getFaqs().then(function(faqs) {
		self.faqs = faqs;
	});
}


HelpService.$inject = ['$http'];
function HelpService($http) {
	var FAQS_SERVICE = "icsm/resources/config/faqs.json";

	return {
		getFaqs : function() {
			return $http.get(FAQS_SERVICE, {cache : true}).then(function(response) {
				return response.data;
			});
		}
	};
}


})(angular);
 (function (mapevents) {
'use strict';

angular.module("icsm.mapevents", ['geo.map'])

.directive('icsmMapevents', ['icsmMapeventsService', function (icsmMapeventsService) {
   return {
      restrict: 'AE',
      link: function (scope) {
         icsmMapeventsService.tickle();
      }
   };
}])

.factory('icsmMapeventsService', ['$rootScope', '$timeout', 'configService', 'mapService',
   function ($rootScope, $timeout, configService, mapService) {
      var marker, poly, bounds;
      var config = configService.getConfig("mapConfig");
      $rootScope.$on('icsm.bounds.draw', function showBbox(event, bbox) {
         // 149.090045383719,-35.4,149.4,-35.3
         if(!bbox) {
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
               coordinates: [
                  [ [xmin, ymin], [xmax, ymin], [xmax, ymax],
                  [xmin, ymax], [xmin, ymin] ]
               ]
            },
            properties: {}
         }, false);
      });

      $rootScope.$on('icsm.bbox.draw', function showBbox(event, bbox) {
         // 149.090045383719,-35.4,149.4,-35.3
         if(!bbox) {
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
               coordinates: [
                  [ [xmin, ymin], [xmax, ymin], [xmax, ymax],
                  [xmin, ymax], [xmin, ymin] ]
               ]
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
            if (typeof data.properties.SAMPLE_LONGITUDE != "undefined") {
               point = {
                  type: "Point",
                  coordinates: [
                     data.properties.SAMPLE_LONGITUDE,
                     data.properties.SAMPLE_LATITUDE
                  ]
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
         console.log("pre getting map to make poly");
         mapService.getMap().then(function (map) {
            console.log("getting map to make poly");
            if (poly) {
               map.removeLayer(poly);
            }

            if(data) {
               poly = L.geoJson(data, {
                  style: function (feature) {
                     return {
                        opacity: 1,
                        clickable: false,
                        fillOpacity: 0,
                        color: "red"
                     };
                  }
               }).addTo(map);

               if(zoomTo) {
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
         console.log("pre getting map to make bounds");
         mapService.getMap().then(function (map) {
            console.log("getting map to make poly");
            if (bounds) {
               map.removeLayer(bounds);
            }

            if(data) {
               bounds = L.geoJson(data, {
                  style: function (feature) {
                     return {
                        opacity: 1,
                        clickable: false,
                        fillOpacity: 0,
                        color: "black"
                     };
                  }
               }).addTo(map);

               if(zoomTo) {
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
         tickle: function () {
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
/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("icsm.list", [])

.directive('icsmList', ['$rootScope', 'listService', function($rootScope, listService) {
	return {
		templateUrl: 'icsm/list/list.html',
		link: function(scope) {
         listService.getMappings().then(function(response) {
            scope.mappings = response;
         });

         listService.getFiletypes().then(function(response) {
            scope.filetypes = response;
         });
         scope.filter = "";

         scope.matched = function() {
            var count = 0;
            if(scope.list) {
               scope.list.forEach(function(item) {
                  count += item.downloadables.length;
               });
            }
            return count;
         };

         scope.fullCount = function(name) {
            var count = 0;
            scope.list.forEach(function(available) {
               if(available.source == name) {
                  count = available.downloadables.length;
               }
            });
            return count;
         };

         scope.update = function() {
            var filteredText =  filterText(scope.list, scope.filter);
            scope.filteredList =  filterTypes(filteredText, scope.filetypes);
            scope.typeCounts = decorateCounts(filteredText, scope.filetypes);
         };

			$rootScope.$on('site.selection', function(event, data) {
            scope.list = [];
            if(data.available_data) {
				   data.available_data.forEach(function(item) {
                  if(item && item.downloadables && item.downloadables.length) {
                     scope.list.push(item);
                  }
               });
            }
            scope.expansions = listService.createExpansions();
            scope.update();
			});

			scope.show = function(data) {
            var bbox = toNumberArray(data.bbox);
            $rootScope.$broadcast('icsm.bbox.draw', bbox);
				console.log("show", bbox);
			};

			scope.hide = function(data) {
            $rootScope.$broadcast('icsm.bbox.draw', null);
				console.log("hide");
			};

         function decorateCounts(list, types) {
            // reset
            var checks = [];
            angular.forEach(types, function(type) {
               type.count = 0;
               checks.push(type);
            });

            if(list) {
               list.forEach(function(item) {
                  item.downloadables.forEach(function(downloadable) {
                     checks.forEach(function(check) {
                        check.count += downloadable[check.countField]?1:0;
                     });
                  });
               });
            }
         }

         function filterTypes(list, types) {
            var NAME_KEY = "index_poly_name";
            var workingList = list;
            var response = [];
            var selected = false;

            // If none are selected then we do all of them
            var keys = {};
            if(list && types) {
               angular.forEach(types, function(type) {
                  if(type.selected) {
                     selected = true;
                     type.fields.forEach(function(field) {
                        keys[field] = true;
                     });
                  }
               });
            }

            if(selected) {
               workingList = list.map(function(item) {
                  var downloadables = [];
                  item.downloadables.forEach(function(download) {
                     var some = false;
                     var builder = {};
                     angular.forEach(download, function(item, key) {
                        if(keys[key]) {
                           some = true;
                           builder[key] = item;
                        }
                     });
                     if(some) {
                        builder.bbox = download.bbox;
                        builder.index_poly_name = download.index_poly_name;
                        downloadables.push(builder);
                     }
                  });
                  return {
                     source: item.source,
                     downloadables: downloadables
                  };
               }).filter(function(item) {
                  return item.downloadables.length > 0;
               });
            }
            return workingList;
         }

         function filterText(list, filter) {
            var NAME_KEY = "index_poly_name";
            var response = [];

            // If we have no text filter we can return now.
            if(!filter) {
               return list;
            }

            list.forEach(function(item) {
               if(item && item.downloadables && item.downloadables.length) {
                  var downloadables = [];
                  item.downloadables.forEach(function(download) {
                     var add = null;
                     angular.forEach(download, function(item, key) {
                        if(key.indexOf("name") == -1) {
                          return;
                        }
                        if((""+item).toUpperCase().search(filter.toUpperCase()) > -1) {
                           add = download;
                        }
                     });

                     if(add) {
                        downloadables.push(add);
                     }
                  });
                  if(downloadables.length) {
                     response.push({
                        downloadables: downloadables,
                        source: item.source
                     });
                  }
               }
            });
            return response;
         }

         function toNumberArray(numbs) {
            if(angular.isArray(numbs) || !numbs) {
               return numbs;
            }
            return numbs.split(/,\s*/g).map(function(numb) {
               return +numb;
            });
         }
		}
	};
}])

.factory('listService', ['$http', function($http) {
   var service = {};
   var expansions = {};

   service.createExpansions = function() {
      expansions = {};
      return expansions;
   };

   service.getMappings = function() {
      return $http.get('icsm/resources/config/list.json').then(function(response) {
         return response.data;
      });
   };

   service.getFiletypes = function() {
      return $http.get('icsm/resources/config/filetypes.json').then(function(response) {
         return response.data;
      });
   };

   return service;
}])

.filter('downloadables', function() {
   return function(available) {
      console.log(available);
      var response = [];
      if(available) {
         available.forEach(function(item) {
            if(item && item.downloadables && item.downloadables.length) {
               response.push(item);
            }
         });
      }
      return response;
   };
})

.filter('fileSize', function() {
	var meg = 1000 * 1000;
	var gig = meg * 1000;
	var ter = gig * 1000;

	return function(size) {
		if(!size) {
			return "-";
		}
		size = parseFloat(size);

		if(size < 1000) {
			return size + " bytes";
		}
		if(size < meg) {
			return (size / 1000).toFixed(1) + " kB";
		}
		if(size < gig) {
			return (size / meg).toFixed(1) + " MB";
		}
		if(size < ter) {
			return (size / gig).toFixed(1) + " GB";
		}
		return (size / ter).toFixed(1) + " TB";
	};
});

})(angular);
/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {
'use strict';

angular.module("icsm.panes", [])

.directive("icsmPanes", ['$rootScope', '$timeout', 'mapService', function($rootScope, $timeout, mapService) {
	return {
		templateUrl : "icsm/panes/panes.html",
		transclude : true,
		scope : {
			defaultItem : "@",
			data : "="
		},
		controller : ['$scope', function($scope) {
			var changeSize = false;

			$scope.view = $scope.defaultItem;

			$scope.setView = function(what) {
				var oldView = $scope.view;

				if($scope.view == what) {
					if(what) {
						changeSize = true;
					}
					$scope.view = "";
				} else {
					if(!what) {
						changeSize = true;
					}
					$scope.view = what;
				}

				$rootScope.$broadcast("view.changed", $scope.view, oldView);

				if(changeSize) {
					mapService.getMap().then(function(map) {
						map._onResize();
					});
				}
			};
			$timeout(function() {
				$rootScope.$broadcast("view.changed", $scope.view, null);
			},50);
		}]
	};
}])

.directive("icsmTabs", [function() {
	return {
		templateUrl : "icsm/panes/tabs.html",
		require : "^icsmPanes"
	};
}])

.controller("PaneCtrl", PaneCtrl)
.factory("paneService", PaneService);

PaneCtrl.$inject = ["paneService"];
function PaneCtrl(paneService) {
	paneService.data().then(function(data) {
		this.data = data;
	}.bind(this));
}

PaneService.$inject = [];
function PaneService() {
	var data = {
	};

	return {
		add : function(item) {
		},

		remove : function(item) {
		}
	};
}

})(angular);
/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular){
'use strict';

angular.module("icsm.plot", [])

.directive("icsmPlot", ['$log', function($log) {
	return {
		restrict : "AE",
		scope : {
			line: "="
		},
		link : function(scope, element, attrs, ctrl) {
			scope.$watch("line", function(newValue, oldValue) {
				$log.info(newValue);
			});
		}
	};
}]);

})(angular);
/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("icsm.select.service", [])
.factory("selectService", SelectService);

SelectService.$inject = ['$http', '$q', '$rootScope', '$timeout', 'mapService', 'configService'];
function SelectService($http, $q, $rootScope, $timeout, mapService, configService) {
	var LAYER_GROUP_KEY = "Search Layers",
		baseUrl = "icsm/resources/config/select.json",
		parameters = {
			text : "",
			daterange : {
				enabled : false,
				upper : null,
				lower : null
			},
			bbox : {
				fromMap : true,
				intersects : true,
				yMax : null,
				yMin : null,
				xMax : null,
				xMin : null
			},
			defaultKeywords : [],
			keywords : []
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

		getSelectCriteria : function() {
			return parameters;
		},

		getLayerGroup : function() {
			// Prime the layer group
			if(!selectLayerGroup) {
				selectLayerGroup = mapService.getGroup(LAYER_GROUP_KEY);
			}
			return selectLayerGroup;
		},

		setKeywords : function(keywords) {
		},

		setFilter : function(filter) {
		},

		refresh : function() {
		},

		getDaterange : function() {
			return parameters.daterange;
		},

		more : function() {
		},

		_executeQuery : function() {
			// Give them the lot as they will want the criteria as well
			$http.get(baseUrl, {cache: true}).then(function(response) {
				service.getLayerGroup();

				var data = response.data;

				data.response.docs.forEach(function(dataset) {
					service._decorateDataset(dataset);
					if(dataset.type == "group") {
						dataset.docs.forEach(function(data) {
							service._decorateDataset(data);
						});
					}
				});

				$rootScope.$broadcast("select.facet.counts", data);
				$rootScope.$broadcast("select.results.received", data);
			});
		},

		createLayer : function(dataset, color) {
			var bbox = dataset.bbox,
				key = dataset.primaryId,
				parts, bounds, layer;

			layer = layers[key];
			if(!layer) {

				if(!bbox) {
					return null;
				}

				parts = bbox.split(" ");
				if(parts.length != 4) {
					return null;
				}

				if(!color) {
					color = normalLayerColor;
				}
				bounds = [[+parts[1], +parts[0]], [+parts[3], +parts[2]]];

				// create a black rectangle
				layer = L.rectangle(bounds, {
					fill:false,
					color: "#000000",
					width:3,
					clickable: false
				});

				layers[key] = layer;
			}
			this._decorateDataset(dataset);
			selectLayerGroup.addLayer(layer);
			return layer;
		},

		_decorateDataset : function(dataset) {
			var layer = layers[dataset.primaryId];
			if(layer) {
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
				if(!bbox) {
					return null;
				} else {
					parts = bbox.split(/\s/g);
					return {
						xMin : +parts[0],
						xMax : +parts[2],
						yMax : +parts[3],
						yMin : +parts[1]
					};
				}
			}
		},

		showWithin : function(datasets) {
			datasets.forEach(function(dataset) {
				var box = dataset.bbox,
					coords, xmin, ymin, xmax, ymax;

				if(!box) {
					service.removeLayer(dataset);
				} else {
					coords = box.split(" ");
					if(coords.length == 4 && within(+coords[0], +coords[1], +coords[2], +coords[3])) {
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

				return xmin > bbox.xMin &&
					   xmax < bbox.xMax &&
					   ymin > bbox.yMin &&
					   ymax < bbox.yMax;
			}
		},

		toggle : function(dataset) {
			if(dataset.showLayer) {
				this.removeLayer(dataset);
			} else {
				this.createLayer(dataset);
			}
		},

		toggleAll : function(datasets) {
			var self = this,
				someNotShowing = datasets.some(function(dataset) {
					return !dataset.showLayer;
				});

			datasets.forEach(function(dataset) {
				if(someNotShowing) {
					if(!dataset.showLayer) {
						self.createLayer(dataset);
					}
				} else {
					if(dataset.showLayer) {
						self.removeLayer(dataset);
					}
				}
			});
			return !someNotShowing;
		},

		hideAll : function(datasets) {
			datasets.forEach(function(dataset) {
				if(dataset.showLayer) {
					service.removeLayer(dataset);
				}
			});
		},

		hilight : function(layer) {
			layer.setStyle({color:hilightLayerColor});
		},

		lolight : function(layer) {
			layer.setStyle({color:normalLayerColor});
		},

		removeLayer : function(dataset) {
			var key = dataset.primaryId,
				layer = layers[key];

			if(layer) {
				selectLayerGroup.removeLayer(layer);
				delete layers[key];
			}
			this._decorateDataset(dataset);
		}
	};

	execute();
	return service;

	function execute() {
		$timeout(function() {
			service._executeQuery();
		}, 100);
	}

}

function servicesFactory(uris) {
	var protocols = {
			WCS :"OGC:WCS",
			WFS :"OGC:WFS",
			WMS :"OGC:WMS"
	};

	return new Services(uris);

	function Services(uris) {
		this.uris = uris;
		this.container = {
			wcs: null,
			wms: null
		};

		if(uris) {
			this.services = uris.map(function(uri) {
				var service = new Service(uri);

				this.container.wcs = service.isWcs()?service:this.container.wcs;
				this.container.wms = service.isWms()?service:this.container.wms;
				return service;
			}.bind(this));
		} else {
			this.services = [];
		}

		this.hasWcs = function() {
			return this.container.wcs !== null;
		};

		this.hasWms = function() {
			return this.container.wms !== null;
		};

		this.getWcs = function() {
			return this.container.wcs;
		};

		this.getWms = function() {
			return this.container.wms;
		};

		this.remove = function() {
			this.services.forEach(function(service) {
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


		this.isWcs = function() {
			// console.log("Checking results:" + (this.protocol == protocols.WCS));
			return this.protocol == protocols.WCS;
		};

		this.isWfs = function() {
			return this.protocol == protocols.WFS;
		};

		this.isWms = function() {
			return this.protocol == protocols.WMS;
		};

		this.isSupported = function() {
			return typeof protocols[this.protocol] == "undefined";
		};

		this.addHandler = function(callback) {
			this.handlers.push(callback);
		};

		this.removeHandler = function(callback) {
			this.handlers.push(callback);
		};

		this.remove = function() {
			this.handlers.forEach(function(callback) {
				// They should all have a remove but you never know.
				if(this.callback.remove) {
					callback.remove(this);
				}
			}.bind(this));
			this.handlers = [];
		};
	}

	Service.prototype = {
		getUrl : function() {
			if(url) {
				if(url.indexOf("?") < 0) {
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
/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';	

angular.module("icsm.select", ['icsm.select.service'])

.controller("SelectCtrl", SelectCtrl)
.controller("SelectCriteriaCtrl", SelectCriteriaCtrl)

.directive("icsmSelect", [function() {
	return {
		templateUrl : "icsm/select/select.html",
		link: function(scope, element, attrs) {
			console.log("Hello select!");
		}
	};
}])

.directive("selectDoc", [function() {
	return {
		templateUrl : "icsm/select/doc.html",
		link: function(scope, element, attrs) {
			console.log("What's up doc!");
		}
	};
}])


.directive("selectGroup", [function() {
	return {
		templateUrl : "icsm/select/group.html",
		scope: {
			group: "="
		},
		link: function(scope, element, attrs) {
			console.log("What's up doc!");
		}
	};
}])

/**
 * Format the publication date
 */
.filter("pubDate", function() {
	return function(string) {
		var date;
		if(string) {
			date = new Date(string);
			return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
		}
		return "-";
	};
})

/**
 * Format the array of authors
 */
.filter("authors", function() {
	return function(auth) {
		if(auth) {
			return auth.join(", ");
		}
		return "-";
	};
})

/**
 * If the text is larger than a certain size truncate it and add some dots to the end.
 */
.filter("truncate", function() {
	return function(text, length) {
		if(text && text.length > length - 3) {
			return text.substr(0, length -3) + "...";
		}
		return text;
	};
});


SelectCriteriaCtrl.$inject = ["selectService"];
function SelectCriteriaCtrl(selectService) {
	this.criteria = selectService.getSelectCriteria();
	
	this.refresh = function() {
		selectService.refresh();
	};
}

SelectCtrl.$inject = ['$rootScope', 'configService', 'flashService', 'selectService'];
function SelectCtrl($rootScope, configService, flashService, selectService) {
	var flasher, self = this;
	
	$rootScope.$on("select.results.received", function(event, data) {
		//console.log("Received response")
		flashService.remove(flasher);
		self.data = data;
	});
	
	configService.getConfig("facets").then(function(config) {
		this.hasKeywords = config && config.keywordMapped && config.keywordMapped.length > 0;
	}.bind(this));
	
	this.select = function() {
		flashService.remove(flasher);
		flasher = flashService.add("Selecting", 3000, true);
		selectService.setFilter(this.filter);
	};

	this.toggle = function(result) {
		selectService.toggle(result);
	};
	
	this.toggleAll = function() {
		selectService.toggleAll(this.data.response.docs);
	};
	
	this.showWithin = function() {
		selectService.showWithin(this.data.response.docs);
	};

	this.allShowing = function() {
		if(!this.data || !this.data.response) {
			return false;
		}
		return !this.data.response.docs.some(function(dataset) {
			return !dataset.showLayer;
		});
	};

	this.anyShowing = function() {
		if(!this.data || !this.data.response) {
			return false;
		}
		return this.data.response.docs.some(function(dataset) {
			return dataset.showLayer;
		});
	};
	
	this.hideAll = function() {
		selectService.hideAll(this.data.response.docs);
	};
	
	this.hilight = function(doc) {
		if(doc.layer) {
			selectService.hilight(doc.layer);
		}
	};
	
	this.lolight = function(doc) {
		if(doc.layer) {
			selectService.lolight(doc.layer);
		}
	};
}

})(angular);


/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */
(function(angular) {


'use strict';

angular.module("icsm.splash", [])

.directive('icsmSplash', ['$rootScope', '$uibModal', '$log', 'splashService',
                        function($rootScope, $uibModal, $log, splashService){
	return {
		controller : ['$scope', 'splashService', function ($scope, splashService) {
			$scope.acceptedTerms = true;

			splashService.getReleaseNotes().then(function(messages) {
				$scope.releaseMessages = messages;
				$scope.acceptedTerms = splashService.hasViewedSplash();
			});
		}],
		link : function(scope, element) {
			var modalInstance;

			scope.$watch("acceptedTerms", function(value) {
				if(value === false) {
					modalInstance = $uibModal.open({
						templateUrl: 'icsm/splash/splash.html',
						size: "lg",
						backdrop : "static",
						keyboard : false,
						controller : ['$scope', '$uibModalInstance', 'acceptedTerms', 'messages',
                        function ($scope, $uibModalInstance, acceptedTerms, messages) {
							$scope.acceptedTerms = acceptedTerms;
							$scope.messages = messages;
							$scope.accept = function () {
								$uibModalInstance.close(true);
							};
						}],
						resolve: {
							acceptedTerms: function () {
								return scope.acceptedTerms;
							},
							messages : function() {
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

			$rootScope.$on("logoutRequest", function() {
				userService.setAcceptedTerms(false);
			});
		}
	};
}])

.factory("splashService", ['$http', function($http) {
	var VIEWED_SPLASH_KEY = "icsm.accepted.terms",
		releaseNotesUrl = "icsm/resources/service/releaseNotes";

	return {
		getReleaseNotes : function() {
			return $http({
				method : "GET",
				url : releaseNotesUrl + "?t=" + Date.now()
			}).then(function(result) {
				return result.data;
			});
		},
		hasViewedSplash : hasViewedSplash,
		setHasViewedSplash : setHasViewedSplash
	};

	function setHasViewedSplash(value) {
		if(value) {
			sessionStorage.setItem(VIEWED_SPLASH_KEY, true);
		} else {
			sessionStorage.removeItem(VIEWED_SPLASH_KEY);
		}
	}

	function hasViewedSplash() {
		return !!sessionStorage.getItem(VIEWED_SPLASH_KEY);
	}
}])

.filter("priorityColor", [function() {
	var map = {
		IMPORTANT: "red",
		HIGH: "blue",
		MEDIUM: "orange",
		LOW: "gray"
	};

	return function(priority) {
		if(priority in map) {
			return map[priority];
		}
		return "black";
	};
}])

.filter("wordLowerCamel", function() {
	return function(priority) {
		return priority.charAt(0) + priority.substr(1).toLowerCase();
	};
})

.filter("sortNotes", [function() {
	return function(messages) {
		if(!messages) {
			return;
		}
		var response = messages.slice(0).sort(function(prev, next) {
			if(prev.priority == next.priority) {
				return prev.lastUpdate == next.lastUpdate?0:next.lastUpdate - prev.lastUpdate;
			} else {
				return prev.priority == "IMPORTANT"?-11:1;
			}
		});
		return response;

	};
}]);

})(angular);
/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module('icsm.state', [])

.directive("icsmStateToggle", ['downloadService', function(downloadService) {
	return {
		restrict: 'AE',
		template : '<button ng-click="toggle(false)" ng-disabled="state.show" class="btn btn-default" title="Start downlaod selection."><i class="fa fa-lg fa-object-group"></i></button>',
		link: function(scope) {
			downloadService.data().then(function(data) {
				scope.state = data;
			});

			scope.toggle = function() {
				scope.state.show = !scope.state.show;
			};
		}
	};
}]);

})(angular);



 (function(angular) {

'use strict';

angular.module('icsm.themes', [])

	/**
 	 *
 	 * Override the original mars user.
 	 *
  	 */
	.directive('icsmThemes', ['themesService', function(themesService) {
		return { 
			restrict: 'AE',
			templateUrl: 'icsm/themes/themes.html',
			link: function(scope) {
				themesService.getThemes().then(function(themes) {
					scope.themes = themes;
				});
				
				themesService.getCurrentTheme().then(function(theme) {
					scope.theme = theme;
				});
				
				scope.changeTheme = function(theme) {
					scope.theme = theme;
					themesService.setTheme(theme.key);
				};
			}
		};
   }])
	
	.controller('themesCtrl', ['themesService', function(themesService) {
		this.service = themesService;	
	}])
	
	.filter('themesFilter', function() {
   	return function(features, theme) {
			var response = [];
			// Give 'em all if they haven't set a theme.
			if(!theme) {
				return features;
			}
			
			if(features) {
				features.forEach(function(feature) {
					if(feature.themes) {
         			if( feature.themes.some(function(name) {
							return name == theme.key;
						})) {
							response.push(feature);
						}
      			}
      		});
			}
			return response;
   	};
	})
	
	.factory('themesService', ['$q', 'configService', 'persistService', function($q, configService, persistService) {
		var THEME_PERSIST_KEY = 'icsm.current.theme';
		var DEFAULT_THEME = "All";
		var waiting = [];
		var self = this;
		
		this.themes = [];	
		this.theme = null;	
		
		persistService.getItem(THEME_PERSIST_KEY).then(function(value) {
			if(!value) {
				value = DEFAULT_THEME;
			} 
			configService.getConfig('themes').then(function(themes) {
				self.themes = themes;
				self.theme = themes[value];
				// Decorate the key
				angular.forEach(themes, function(theme, key) { 
					theme.key = key;
				});
				waiting.forEach(function(wait) {
						wait.resolve(self.theme);
				});
			});
		});
	
		
		this.getCurrentTheme = function(){ 
			if(this.theme) {
				return $q.when(self.theme);
			} else {
				var waiter = $q.defer();
				waiting.push(waiter);
				return waiter.promise;
			}
		};
		
		this.getThemes = function() {
			return configService.getConfig('themes');
		};
		
		this.setTheme = function(key) {
			this.theme = this.themes[key];
			persistService.setItem(THEME_PERSIST_KEY, key);
		};
		
		return this;
	}]);
	
})(angular);
/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular, $) {
'use strict';

angular.module("icsm.view", [])

.directive("icsmView", ['downloadService', function(downloadService) {
	return {
		templateUrl : "icsm/view/view.html",
		controller : "DownloadCtrl",
		link : function(scope, element) {
			downloadService.data().then(function(data) {
				scope.data = data;
			});

			scope.$watch("data.item", function(item, old) {
				if(item || old) {
					downloadService.setState(item);
				}
			});
		}
	};
}])

.controller("DownloadCtrl", DownloadCtrl)
.factory("downloadService", DownloadService);

DownloadCtrl.$inject = ["downloadService"];
function DownloadCtrl(downloadService) {
	downloadService.data().then(function(data) {
		this.data = data;
	}.bind(this));

	this.remove = function() {
		downloadService.clear();
	};

	this.changeEmail = function(email) {
		downloadService.setEmail(email);
	};
}

DownloadService.$inject = ['$http', '$q', '$rootScope', 'mapService', 'persistService'];
function DownloadService($http, $q, $rootScope, mapService, persistService) {
	var key = "download_email",
		downloadLayerGroup = "Download Layers",

	mapState = {
		zoom : null,
		center : null,
		layer : null
	},

	data = null,

	service = {
		getLayerGroup : function() {
			return mapService.getGroup(downloadLayerGroup);
		},

		setState : function(data) {
			if(data) {
				prepare();
			} else {
				restore();
			}

			function prepare() {

				var bounds = [
					    [data.bounds.yMin, data.bounds.xMin],
					    [data.bounds.yMax, data.bounds.xMax]
					];

				if(mapState.layer) {
					mapService.getGroup(downloadLayerGroup).removeLayer(mapState.layer);
				}
			}
			function restore(map) {
            if(mapState.layer) {
				   mapService.clearGroup(downloadLayerGroup);
				   mapState.layer = null;
            }
			}
		},

		decorate : function() {
			var item = data.item;
			data.item.download = true;
			if(!item.processsing) {
				item.processing = {
					clip : {
						xMax : null,
						xMin : null,
						yMax : null,
						yMin : null
					}
				};
			}
		},

		setEmail : function(email) {
			persistService.setItem(key, email);
		},

		getEmail : function() {
			return persistService.getItem(key).then(function(value) {
				data.email = value;
				return value;
			});
		},

		data : function() {
			if(data) {
				return $q.when(data);
			}

			return $http.get('icsm/resources/config/icsm.json').then(function(response) {
				data = response.data;
				service.decorate();
				return data;
			});
		}
	};

	return service;
}

})(angular, $);
/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("icsm.toolbar", [])

.directive("icsmToolbar", [function() {
	return {
		controller: 'toolbarLinksCtrl'
	};
}])


/**
 * Override the default mars tool bar row so that a different implementation of the toolbar can be used.
 */
.directive('icsmToolbarRow', [function() {
	return {
		scope:{
			map:"="
		},
		restrict:'AE',
		templateUrl:'icsm/toolbar/toolbar.html'
	};
}])

.directive('icsmToolbarInfo', [function() {
	return {
		templateUrl: 'radwaste/toolbar/toolbarInfo.html'
	};
}])

.controller("toolbarLinksCtrl", ["$scope", "configService", function($scope, configService) {

	var self = this;
	configService.getConfig().then(function(config) {
		self.links = config.toolbarLinks;
	});

	$scope.item = "";
	$scope.toggleItem = function(item) {
		$scope.item = ($scope.item == item) ? "" : item;
	};

}]);

})(angular);
angular.module("icsm.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("icsm/app/app.html","<div>\r\n	<!-- BEGIN: Sticky Header -->\r\n	<div explorer-header style=\"z-index:1\" \r\n			class=\"navbar navbar-default navbar-fixed-top\" \r\n			heading=\"\'Explorer ICSM\'\"\r\n			headingtitle=\"\'ICSM\'\"\r\n			breadcrumbs=\"[{name:\'ICSM\', title: \'Reload Explorer ICSM\', url: \'.\'}]\"\r\n			helptitle=\"\'Get help about Explorer ICSM\'\"\r\n			helpalttext=\"\'Get help about Explorer ICSM\'\">\r\n	</div>\r\n	<!-- END: Sticky Header -->\r\n\r\n\r\n	<!-- Messages go here. They are fixed to the tab bar. -->\r\n	<div explorer-messages class=\"marsMessages noPrint\"></div>\r\n\r\n	<icsm-panes data=\"root.data\" default-item=\"download\"></icsm-panes>\r\n</div>");
$templateCache.put("icsm/clip/clip.html","<div class=\"well well-sm\">\r\n	<div class=\"container-fluid\">\r\n		<div class=\"row\">\r\n			<div class=\"col-md-10\">\r\n				<button style=\"margin-top:0px;\" ng-click=\"initiateDraw()\" ng-disable=\"client.drawing\"  tooltip-placement=\"right\"\r\n               uib-tooltip=\"Enable drawing of a bounding box. On enabling, click on the map and drag diagonally\" class=\"btn btn-primary btn-xs\">Draw</button>\r\n			</div>\r\n			<div class=\"col-md-2\">\r\n				<button style=\"float:right\" ng-click=\"showInfo = !showInfo\"  tooltip-placement=\"left\"\r\n               uib-tooltip=\"Information.\" class=\"btn btn-primary btn-xs\"><i class=\"fa fa-info\"></i></button>\r\n				<exp-info title=\"Selecting an area\" show-close=\"true\" style=\"width:450px;position:fixed;top:230px;right:40px\" is-open=\"showInfo\"><icsm-info-bbox></div></exp-info>\r\n			</div>\r\n		</div>\r\n		<div class=\"row\">\r\n			<div class=\"col-md-3\"> </div>\r\n			<div class=\"col-md-8\">\r\n				<div style=\"font-weight:bold;width:3.5em;display:inline-block\">Y Max:</div>\r\n				<span>\r\n               <input type=\"text\" style=\"width:6em\" ng-model=\"clip.yMax\" ng-change=\"check()\"></input>\r\n               <span ng-show=\"showBounds && bounds\">({{bounds.yMax|number : 4}} max)</span>\r\n            </span>\r\n			</div>\r\n		</div>\r\n		<div class=\"row\">\r\n			<div class=\"col-md-6\">\r\n				<div style=\"font-weight:bold;width:3.5em;display:inline-block\">X Min:</div>\r\n				<span>\r\n               <input type=\"text\" style=\"width:6em\" ng-model=\"clip.xMin\" ng-change=\"check()\"></input>\r\n               <span ng-show=\"showBounds && bounds\">({{bounds.xMin|number : 4}} min)</span>\r\n            </span>\r\n			</div>\r\n			<div class=\"col-md-6\">\r\n				<div style=\"font-weight:bold;width:3.5em;display:inline-block\">X Max:</div>\r\n				<span>\r\n               <input type=\"text\" style=\"width:6em\" ng-model=\"clip.xMax\" ng-change=\"check()\"></input>\r\n               <span ng-show=\"showBounds && bounds\">({{bounds.xMax|number : 4}} max)</span>\r\n            </span>\r\n			</div>\r\n		</div>\r\n		<div class=\"row\">\r\n			<div class=\"col-md-offset-3 col-md-8\">\r\n				<div style=\"font-weight:bold;width:3.5em;display:inline-block\">Y Min:</div>\r\n				<span>\r\n               <input type=\"text\" style=\"width:6em\" ng-model=\"clip.yMin\" ng-change=\"check()\"></input>\r\n               <span ng-show=\"showBounds && bounds\">({{bounds.yMin|number : 4}} min)</span>\r\n            </span>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/clip/infobbox.html","<div class=\"\">\r\n	<strong style=\"font-size:120%\">Select an area of interest.</strong> There are two ways to select your area of interest:\r\n	<ol>\r\n		<li>By hitting the \"Draw\" button an area on the map can be selected with the mouse by clicking a\r\n         corner and while holding the left mouse button\r\n			down drag diagonally across the map to the opposite corner or</li>\r\n		<li>Type your co-ordinates into the areas above.</li>\r\n	</ol>\r\n	Once drawn the points can be modified by the overwriting the values above or drawing another area by\r\n   clicking the \"Draw\" button again. <br/>\r\n	<strong>Notes:</strong>\r\n   <ul>\r\n      <li>The data does not cover all of Australia.</li>\r\n      <li>Restrict a search area to below four square degrees. eg 2x2 or 1x4</li>\r\n   </ul>\r\n	<p style=\"padding-top:5px\"><strong>Hint:</strong> If the map has focus, you can use the arrow keys to pan the map.\r\n		You can zoom in and out using the mouse wheel or the \"+\" and \"-\" map control on the top left of the map. If you\r\n		don\'t like the position of your drawn area, hit the \"Draw\" button and draw a new bounding box.\r\n	</p>\r\n</div>");
$templateCache.put("icsm/glossary/glossary.html","<div ng-controller=\"GlossaryCtrl as glossary\">\r\n	<div style=\"position:relative;padding:5px;padding-left:10px;\" >\r\n		<div class=\"panel panel-default\" style=\"padding:5px;\" >\r\n			<div class=\"panel-heading\">\r\n				<h3 class=\"panel-title\">Glossary</h3>\r\n			</div>\r\n			<div class=\"panel-body\">\r\n				\r\n				\r\n	<table class=\"table table-striped\">\r\n		<thead>\r\n			<tr>\r\n				<th>Term</th>\r\n				<th>Definition</th>\r\n			</tr>\r\n		</thead>\r\n		<tbody>\r\n			<tr ng-repeat=\"term in glossary.terms\">\r\n				<td>{{term.term}}</td>\r\n				<td>{{term.definition}}</td>\r\n			</tr>\r\n		</tbody>\r\n	</table>\r\n</div>\r\n</div>\r\n</div>");
$templateCache.put("icsm/help/faqs.html","<div class=\"container\" style=\"width:100%;border: 1px solid lightgray\">\r\n	<p style=\"text-align: left; margin: 10px; font-size: 14px;\">\r\n		<strong>FAQS</strong>\r\n	</p>	\r\n\r\n	<h5 ng-repeat=\"faq in faqs\"><button type=\"button\" class=\"undecorated\" ng-click=\"focus(faq.key)\">{{faq.question}}</button></h5>\r\n	<hr/>\r\n	<div class=\"row\" ng-repeat=\"faq in faqs\">\r\n		<div class=\"col-md-12\">\r\n			<h5 tabindex=\"0\" id=\"faqs_{{faq.key}}\">{{faq.question}}</h5>\r\n			<span ng-bind-html=\"faq.answer\"></span>\r\n			<hr/>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/help/help.html","<div ng-controller=\"HelpCtrl as help\">\r\n	<div style=\"position:relative;padding:5px;padding-left:10px;\" >\r\n		<div class=\"panel panel-default\" style=\"padding:5px;\" >\r\n			<div class=\"panel-heading\">\r\n				<h3 class=\"panel-title\">Help</h3>\r\n			</div>\r\n			<div class=\"panel-body\">\r\n				The steps to get data!\r\n				<ol>\r\n					<li>Select dataset of interest <i class=\"fa fa-download\"></i> from Select tab</li>\r\n					<li>Define area</li>\r\n					<li>Select output format</li>\r\n					<li>Select coordinate system</li>\r\n					<li>Enter email address</li>\r\n					<li>Submit entries</li>\r\n				</ol>\r\n				An email will be sent to you on completion of the data extract with a link to your data.\r\n				<icsm-faqs faqs=\"help.faqs\" ></icsm-faqs>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/list/list.html","<div ng-show=\"!list || !list.length\">\r\n	<div class=\"alert alert-warning\" role=\"alert\"><strong>Select an area</strong> to find datasets within.</div>\r\n</div>\r\n\r\n<div ng-show=\"list.length\">\r\n   <div class=\"row\">\r\n      <div class=\"col-md-5\" uib-tooltip=\"Number of intersecting or very near datasets to your area of interest.\">\r\n	      <h4 style=\"display:inline-block\">Found {{matched()| number}} datasets</h4>\r\n      </div>\r\n      <div class=\"col-md-7\">\r\n         <div class=\"input-group input-group-sm\">\r\n            <span class=\"input-group-addon\" id=\"names1\">Filter:</span>\r\n            <input type=\"text\" ng-model=\"filter\" class=\"form-control\"\r\n                   ng-change=\"update()\" placeholder=\"Filter names\" aria-describedby=\"names1\">\r\n            <span class=\"input-group-btn\">\r\n               <button class=\"btn btn-primary\" type=\"button\" data-toggle=\"collapse\" uib-tooltip=\"Filter by file content type\"\r\n                     data-target=\"#collapseFilters\" aria-expanded=\"false\" aria-controls=\"collapseFilters\">\r\n                  More...\r\n               </button>\r\n            </span>\r\n         </div>\r\n      </div>\r\n   </div>\r\n   <div class=\"collapse\" id=\"collapseFilters\">\r\n      <div class=\"well\">\r\n         <div class=\"row\">\r\n            <span class=\"listTypeLabel\">File type</span>\r\n            <span ng-repeat=\"type in filetypes\" class=\"listType\">\r\n               <input type=\"checkbox\" ng-model=\"type.selected\" ng-change=\"update()\"/>\r\n               <span uib-tooltip=\"{{type.description}}\">{{type.label}} ({{type.count}})</span>\r\n            </span>\r\n         </div>\r\n      </div>\r\n   </div>\r\n\r\n   <div ng-repeat=\"available in filteredList\" class=\"well\">\r\n      <h5>\r\n         <button class=\"undecorated\" ng-click=\"expansions[available.source] = !expansions[available.source]\" uib-tooltip=\"Click to collapse/expand this group\"\r\n                  aria-expanded=\"true\" aria-controls=\"collapse{{mappings[available.source].code}}\">\r\n            <img ng-src=\"{{mappings[available.source].image}}\" style=\"height:{{mappings[available.source].height}}px\"></img>\r\n         </button>\r\n         <strong>{{available.source}}</strong>\r\n         (Showing {{available.downloadables.length}} of {{fullCount(available.source)}})\r\n         <span class=\"listTopExpander\">\r\n            <button class=\"undecorated\" ng-click=\"expansions[available.source] = !expansions[available.source]\">\r\n               [{{expansions[available.source]?\"collapse\":\"expand\"}}]\r\n            </button>\r\n         </span>\r\n      </h5>\r\n      <div uib-collapse=\"!expansions[available.source]\">\r\n         <div class=\"listRow\" ng-class-odd=\"\'listEven\'\" ng-repeat=\"item in available.downloadables\"\r\n               data-ng-mouseenter=\"show(item)\" data-ng-mouseleave=\"hide(item)\">\r\n            <h5 ng-show=\"item.index_poly_name\">{{item.index_poly_name}}</h5>\r\n            <div ng-show=\"item.file_size_ell\">\r\n               <div>\r\n                  <a href=\"{{item.ell_url}}\">\r\n                     <i class=\"fa fa-download\"></i>\r\n                     {{item.ell_name}}\r\n                  </a>\r\n                  <span style=\"float:right;width:8em\">Size: {{item.file_size_ell | fileSize}}</span>\r\n               </div>\r\n            </div>\r\n            <div ng-show=\"item.file_size_las\">\r\n               <div>\r\n                  <a href=\"{{item.las_url}}\">\r\n                     <i class=\"fa fa-download\"></i>\r\n                     {{item.las_name}}\r\n                  </a>\r\n                  <span style=\"float:right;width:8em\">Size: {{item.file_size_las | fileSize}}</span>\r\n               </div>\r\n            </div>\r\n            <div ng-show=\"item.file_size_ort\">\r\n               <div>\r\n                  <a href=\"{{item.ort_url}}\">\r\n                     <i class=\"fa fa-download\"></i>\r\n                     {{item.ort_name}}\r\n                  </a>\r\n                  <span style=\"float:right;width:8em\">Size: {{item.file_size_ort | fileSize}}</span>\r\n               </div>\r\n            </div>\r\n            <div ng-show=\"item.file_size_asc\">\r\n               <div>\r\n                  <a href=\"{{item.asc_url}}\">\r\n                     <i class=\"fa fa-download\"></i>\r\n                     {{item.asc_name}}\r\n                  </a>\r\n                  <span style=\"float:right;width:8em\">Size: {{item.file_size_asc | fileSize}}</span>\r\n               </div>\r\n            </div>\r\n            <div ng-show=\"item.file_size_prj\">\r\n               <div>\r\n                  <a href=\"{{item.prj_url}}\">\r\n                     <i class=\"fa fa-download\"></i>\r\n                     {{item.prj_name}}\r\n                  </a>\r\n                  <span style=\"float:right;width:8em\">Size: {{item.file_size_prj | fileSize}}</span>\r\n               </div>\r\n            </div>\r\n            <div ng-show=\"item.file_size_dem\">\r\n               <div>\r\n                  <a href=\"{{item.dem_url}}\">\r\n                     <i class=\"fa fa-download\"></i>\r\n                     {{item.dem_name}}\r\n                  </a>\r\n                  <span style=\"float:right;width:8em\">Size: {{item.file_size_dem | fileSize}}</span>\r\n               </div>\r\n            </div>\r\n         </div>\r\n         <div style=\"text-align:right\"><button class=\"undecorated\" ng-click=\"expansions[available.source] = false\">[collapse]</button></div>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("icsm/panes/panes.html","<div class=\"container contentContainer\">\r\n	<div class=\"row icsmPanesRow\" >\r\n		<div class=\"icsmPanesCol\" ng-class=\"{\'col-md-12\':!view, \'col-md-7\':view}\" style=\"padding-right:0\">\r\n			<div class=\"expToolbar row noPrint\" icsm-toolbar-row map=\"root.map\"></div>\r\n			<div class=\"panesMapContainer\" geo-map configuration=\"data.map\">\r\n			    <geo-extent></geo-extent>\r\n			</div>\r\n    		<div geo-draw data=\"data.map.drawOptions\" line-event=\"elevation.plot.data\" rectangle-event=\"bounds.drawn\"></div>\r\n    		<div icsm-tabs class=\"icsmTabs\"  ng-class=\"{\'icsmTabsClosed\':!view, \'icsmTabsOpen\':view}\"></div>\r\n		</div>\r\n		<div class=\"icsmPanesColRight\" ng-class=\"{\'hidden\':!view, \'col-md-5\':view}\" style=\"padding-left:0; padding-right:0\">\r\n			<div class=\"panesTabContentItem\" ng-show=\"view == \'download\'\" icsm-view></div>\r\n			<div class=\"panesTabContentItem\" ng-show=\"view == \'maps\'\" icsm-maps></div>\r\n			<div class=\"panesTabContentItem\" ng-show=\"view == \'glossary\'\" icsm-glossary></div>\r\n			<div class=\"panesTabContentItem\" ng-show=\"view == \'help\'\" icsm-help></div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/panes/tabs.html","<!-- tabs go here -->\r\n<div id=\"panesTabsContainer\" class=\"paneRotateTabs\" style=\"opacity:0.9\" ng-style=\"{\'right\' : contentLeft +\'px\'}\">\r\n\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'download\'}\" ng-click=\"setView(\'download\')\">\r\n		<button class=\"undecorated\">Download</button>\r\n	</div>\r\n	<!-- \r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'search\'}\" ng-click=\"setView(\'search\')\">\r\n		<button class=\"undecorated\">Search</button>\r\n	</div>\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'maps\'}\" ng-click=\"setView(\'maps\')\">\r\n		<button class=\"undecorated\">Layers</button>\r\n	</div>\r\n	-->\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'glossary\'}\" ng-click=\"setView(\'glossary\')\">\r\n		<button class=\"undecorated\">Glossary</button>\r\n	</div>\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'help\'}\" ng-click=\"setView(\'help\')\">\r\n		<button class=\"undecorated\">Help</button>\r\n	</div>\r\n</div>\r\n");
$templateCache.put("icsm/select/doc.html","<div ng-class-odd=\"\'odd\'\" ng-class-even=\"\'even\'\" ng-mouseleave=\"select.lolight(doc)\" ng-mouseenter=\"select.hilight(doc)\">\r\n	<span ng-class=\"{ellipsis:!expanded}\" tooltip-enable=\"!expanded\" style=\"width:100%;display:inline-block;\" \r\n			tooltip-class=\"selectAbstractTooltip\" tooltip=\"{{doc.abstract | truncate : 250}}\" tooltip-placement=\"bottom\">\r\n		<button type=\"button\" class=\"undecorated\" ng-click=\"expanded = !expanded\" title=\"Click to see more about this dataset\">\r\n			<i class=\"fa pad-right fa-lg\" ng-class=\"{\'fa-caret-down\':expanded,\'fa-caret-right\':(!expanded)}\"></i>\r\n		</button>\r\n		<download-add item=\"doc\" group=\"group\"></download-add>\r\n		<icsm-wms data=\"doc\"></icsm-wms>\r\n		<icsm-bbox data=\"doc\" ng-if=\"doc.showExtent\"></icsm-bbox>\r\n		<a href=\"http://www.ga.gov.au/metadata-gateway/metadata/record/{{doc.sysId}}\" target=\"_blank\" ><strong>{{doc.title}}</strong></a>\r\n	</span>\r\n	<span ng-class=\"{ellipsis:!expanded}\" style=\"width:100%;display:inline-block;padding-right:15px;\">\r\n		{{doc.abstract}}\r\n	</span>\r\n	<div ng-show=\"expanded\" style=\"padding-bottom: 5px;\">\r\n		<h5>Keywords</h5>\r\n		<div>\r\n			<span class=\"badge\" ng-repeat=\"keyword in doc.keywords track by $index\">{{keyword}}</span>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/select/group.html","<div class=\"panel panel-default\" style=\"margin-bottom:-5px;\" >\r\n	<div class=\"panel-heading\"><icsm-wms data=\"group\"></icsm-wms> <strong>{{group.title}}</strong></div>\r\n	<div class=\"panel-body\">\r\n   		<div ng-repeat=\"doc in group.docs\">\r\n   			<select-doc doc=\"doc\" group=\"group\"></select-doc>\r\n		</div>\r\n	</div>\r\n</div>\r\n");
$templateCache.put("icsm/select/select.html","<div>\r\n	<div style=\"position:relative;padding:5px;padding-left:10px;\" ng-controller=\"SelectCtrl as select\" class=\"scrollPanel\">\r\n		<div class=\"panel panel-default\" style=\"margin-bottom:-5px\">\r\n  			<div class=\"panel-heading\">\r\n  				<h3 class=\"panel-title\">Available datasets</h3>\r\n  			</div>\r\n  			<div class=\"panel-body\">\r\n				<div ng-repeat=\"doc in select.data.response.docs\" style=\"padding-bottom:7px\">\r\n					<select-doc ng-if=\"doc.type == \'dataset\'\" doc=\"doc\"></select-doc>\r\n					<select-group ng-if=\"doc.type == \'group\'\" group=\"doc\"></select-group>\r\n				</div>\r\n  			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/splash/splash.html","<div class=\"modal-header\">\r\n   <h3 class=\"modal-title splash\">Explorer ICSM</h3>\r\n</div>\r\n<div class=\"modal-body\" id=\"accept\" ng-form exp-enter=\"accept()\" icsm-splash-modal style=\"width: 100%; margin-left: auto; margin-right: auto;\">\r\n	<div>\r\n		<p>\r\n			Here you can download datasets sourced from jurisdictions.\r\n		</p>\r\n		<p>\r\n			<a href=\"http://www.ga.gov.au/topographic-mapping/digital-elevation-data.html\" target=\"_blank\">Find out more on our Elevation page.</a>\r\n		</p>\r\n		<p>\r\n			Data can be downloaded at <strong>no charge</strong> and there is no limit to how many (please check the file size before you download your files).\r\n		</p>\r\n		<p>\r\n			<a href=\"http://opentopo.sdsc.edu/gridsphere/gridsphere?cid=contributeframeportlet&gs_action=listTools\" target=\"_blank\">Click here for Free GIS Tools.</a>\r\n		</p>\r\n      <h5>How to use</h5>\r\n      <p>\r\n         <ul>\r\n            <li>Click on the map, holding the button down,</li>\r\n            <li>Drag to a diagonal corner (not too big, there is a limit of roughly 2x2 degrees)</li>\r\n            <li>On release we will check for data within or very near yur area of interest</li>\r\n            <li>If the list is large you can filter:\r\n               <ul>\r\n                  <li>Partial text match by typing in the filter field and/or</li>\r\n                  <li>By clicking the more button, you can restrict the display to certain file types</li>\r\n               </ul>\r\n            </li>\r\n            <li>Click on any file you would like to download. To reiterate, these files can be huge so take note of the file size before downloading</li>\r\n         </ul>\r\n      </p>\r\n      <h5>Hints</h5>\r\n      <p>\r\n         <ul>\r\n            <li>You can manually type the coordinates into the boxes. After 5 seconds of no changes the area described is checked, just like drawing the box with the mouse.</li>\r\n            <li>Hovering over many items will give you further information about the purpose of the item</li>\r\n            <li>Drawing a polyline allows you to measure distance along the polyline.</li>\r\n            <li>While the tool to draw your area of interest is enabled it is easiest to pan the map using the arrow keys.</li>\r\n            <li>There are many areas where there is no data though the coverage is improving all the time.</li\r\n         </ul>\r\n      </p>\r\n	</div>\r\n   <div style=\"padding:30px; padding-top:0; padding-bottom:40px; width:100%\">\r\n		<div class=\"pull-right\">\r\n		  	<button type=\"button\" class=\"btn btn-primary ng-pristine ng-valid ng-touched\" ng-model=\"seenSplash\" ng-focus=\"\" ng-click=\"accept()\">Continue</button>\r\n		</div>\r\n	</div>\r\n	<div ng-show=\"messages.length > 0\" class=\"container\" style=\"width:100%; max-height:250px; overflow-y:auto\">\r\n		<div class=\"row\" ng-class-even=\"\'grayline\'\" style=\"font-weight:bold\">\r\n			<div class=\"col-sm-12\" ><h3>News</h3></div>\r\n		</div>\r\n\r\n		<div class=\"row\"ng-class-even=\"\'grayline\'\" style=\"max-height:400px;overflow:auto\" ng-repeat=\"message in messages | sortNotes\">\r\n			<div class=\"col-sm-12\">\r\n				<h4>{{message.title}} <span class=\"pull-right\" style=\"font-size:70%\">Created: {{message.creationDate | date : \"dd/MM/yyyy\"}}</span></h4>\r\n				<div ng-bind-html=\"message.description\"></div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("icsm/themes/themes.html","<div class=\"dropdown themesdropdown\">\r\n  <button class=\"btn btn-default dropdown-toggle themescurrent\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">\r\n    Theme\r\n    <span class=\"caret\"></span>\r\n  </button>\r\n  <ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\">\r\n    <li ng-repeat=\"item in themes\">\r\n       <a href=\"#\" title=\"{{item.title}}\" ng-href=\"{{item.url}}\" class=\"themesItemCompact\">\r\n         <span class=\"icsm-icon\" ng-class=\"item.className\"></span>\r\n         <strong style=\"vertical-align:top;font-size:110%\">{{item.label}}</strong>\r\n       </a>\r\n    </li>\r\n  </ul>\r\n</div>");
$templateCache.put("icsm/view/view.html","<div class=\"container-fluid downloadInner\" >\r\n	<div class=\"row\">\r\n		<div class=\"col-md-12\">\r\n			<h4><icsm-wms data=\"data.item\" ng-title=\"data.item.abstract\"></icsm-wms>{{data.item.title}}</h4>\r\n  			</div>\r\n	</div>\r\n	<icsm-clip data=\"data.item\"></icsm-clip>\r\n	<icsm-list></icsm-list>\r\n</div>");
$templateCache.put("icsm/toolbar/toolbar.html","<div icsm-toolbar>\r\n	<div class=\"row toolBarGroup\">\r\n		<div class=\"btn-group searchBar\" ng-show=\"root.whichSearch != \'region\'\">\r\n			<div class=\"input-group\" geo-search>\r\n				<input type=\"text\" ng-autocomplete ng-model=\"values.from.description\" options=\'{country:\"au\"}\'\r\n							size=\"32\" title=\"Select a locality to pan the map to.\" class=\"form-control\" aria-label=\"...\">\r\n				<div class=\"input-group-btn\">\r\n    				<button ng-click=\"zoom(false)\" exp-ga=\"[\'send\', \'event\', \'icsm\', \'click\', \'zoom to location\']\"\r\n						class=\"btn btn-default\"\r\n						title=\"Pan and potentially zoom to location.\"><i class=\"fa fa-search\"></i></button>\r\n				</div>\r\n			</div>\r\n		</div>\r\n		\r\n		<div class=\"pull-right\">\r\n			<div class=\"btn-toolbar radCore\" role=\"toolbar\"  icsm-toolbar>\r\n				<div class=\"btn-group\">\r\n					<!-- < icsm-state-toggle></icsm-state-toggle> -->\r\n				</div>\r\n			</div>		\r\n		\r\n			<div class=\"btn-toolbar\" style=\"margin:right:10px;display:inline-block\">\r\n				<div class=\"btn-group\">\r\n					<span class=\"btn btn-default\" geo-baselayer-control max-zoom=\"16\" title=\"Satellite to Topography bias on base map.\"></span>\r\n				</div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");}]);