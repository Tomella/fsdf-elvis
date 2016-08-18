(function(angular) {

'use strict';

//angular.module("CoreApp", []);
/*
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
	 	'geo.extent',
	 	'geo.geosearch',
	 	'geo.map',
	 	'geo.maphelper',
	 	'geo.measure',


	 	'icsm.altthemes',
	 	'icsm.autoscroll',
	 	'icsm.bbox',
	 	'icsm.clip',
	 	'icsm.download',
	 	'icsm.extent',
	 	'icsm.glossary',
	 	'icsm.header',
	 	'icsm.help',
	 	'icsm.list',
	 	'icsm.maps',
	 	'icsm.panes',
	 	'icsm.plot',
	 	'icsm.select',
	 	'icsm.splash',
	 	'icsm.state',
	 	//'icsm.themes',
	 	'icsm.toolbar',
		'icsm.user',
	 	'icsm.wms'
])

// Set up all the service providers here.
.config(['configServiceProvider', 'projectsServiceProvider', 'versionServiceProvider',
         function(configServiceProvider, projectsServiceProvider, versionServiceProvider) {
	configServiceProvider.location("icsm/resources/config/config.json");
	versionServiceProvider.url("assets/package.json");
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
*/

})(angular);