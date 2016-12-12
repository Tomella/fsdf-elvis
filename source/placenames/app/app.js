(function(angular) {

'use strict';

angular.module("PlacenamesApp", [
      'placenames.header',
      'placenames.panes',
      "placenames.results",
      "placenames.templates",
      "placenames.search",
	 	'placenames.toolbar',
      "placenames.utils",

      'geo.map',

	 	'common.altthemes',
      'common.baselayer.control',
      'common.navigation',
      'common.proxy',
		'common.storage',
      'common.templates',

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

	 	'ui.bootstrap',
	 	'ui.bootstrap-slider',
      'ngAutocomplete',
	 	'ngRoute',
	 	'ngSanitize',
	 	'page.footer'
])

// Set up all the service providers here.
.config(['configServiceProvider', 'projectsServiceProvider', 'versionServiceProvider',
         function(configServiceProvider, projectsServiceProvider, versionServiceProvider) {
	configServiceProvider.location("icsm/resources/config/placenames.json");
   configServiceProvider.dynamicLocation("icsm/resources/config/appConfig.json?t=");
	versionServiceProvider.url("icsm/assets/package.json");
	projectsServiceProvider.setProject("icsm");
}])

.run(['mapService', function(mapService) {
   mapService.getMap().then(map => {
      map.options.maxZoom = 16;
   });
}])

.factory("userService", [function() {
	return {
		login : noop,
		hasAcceptedTerms: noop,
		setAcceptedTerms: noop,
		getUsername() {
			return "anon";
		}
	};
	function noop() {return true;}
}])

.controller("RootCtrl", RootCtrl);

RootCtrl.$invoke = ['$http', 'configService'];
function RootCtrl($http, configService) {
	var self = this;
	configService.getConfig().then(data => {
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