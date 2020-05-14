(function(angular) {

'use strict';

angular.module("StartApp", [
	 	'common.altthemes',
	 	'common.header',
      'common.navigation',
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

      'start.navigation',
      'start.templates',

	 	'ui.bootstrap',
	 	'ngRoute',
	 	'ngSanitize',
	 	'page.footer'

])

// Set up all the service providers here.
.config(['configServiceProvider', 'projectsServiceProvider', 'versionServiceProvider',
         function(configServiceProvider, projectsServiceProvider, versionServiceProvider) {
	configServiceProvider.location("icsm/resources/config/start.json");
   configServiceProvider.dynamicLocation("icsm/resources/config/appConfig.json?t=");
	versionServiceProvider.url("icsm/assets/package.json");
	projectsServiceProvider.setProject("icsm");
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

RootCtrl.$invoke = ['$http', 'configService'];
function RootCtrl($http, configService) {
	configService.getConfig().then((data) => {
		this.data = data;
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