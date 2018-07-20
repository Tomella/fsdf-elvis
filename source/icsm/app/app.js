{
	class RootCtrl {
      constructor($http, configService, mapService) {
		   mapService.getMap().then(map => {
			   this.map = map;
		   });
		   configService.getConfig().then(data => {
			   this.data = data;
			   // If its got WebGL its got everything we need.
			   try {
				   let canvas = document.createElement('canvas');
				   data.modern = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
			   } catch (e) {
				   data.modern = false;
			   }
		   });
	   }
   }
	RootCtrl.$invoke = ['$http', 'configService', 'mapService'];

	angular.module("IcsmApp", [
		'common.altthemes',
      'common.baselayer.control',
		'common.cc',
      'common.featureinfo',
		'common.header',
		'common.legend',
      'common.navigation',
      //'common.panes',

      'common.reset',
      'common.storage',
      'common.templates',

      'explorer.config',
      'explorer.confirm',
      // 'ed.download',
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
      'vcRecaptcha',

		//'geo.baselayer.control',
		'geo.draw',
		'geo.elevation',
		'geo.geosearch',
		'geo.map',
		'geo.maphelper',
      'geo.measure',

      'placenames.quicksearch',
      'placenames.config',

		'icsm.bounds',
      'icsm.contributors',
		'icsm.clip',
		'icsm.glossary',
		'icsm.help',
		'icsm.panes',
      'icsm.products',
      "icsm.side-panel",
		// Alternate list
		'elvis.header',
		'elvis.results',
		'elvis.reviewing',

      'icsm.mapevents',
		'icsm.select',
		'icsm.splash',
      'icsm.layerswitch',
		'icsm.templates',
		'elevation.toolbar',
		'icsm.view'
	])

		// Set up all the service providers here.
		.config(['configServiceProvider', 'placenamesConfigServiceProvider', 'projectsServiceProvider', 'persistServiceProvider', 'versionServiceProvider',
         function (configServiceProvider, placenamesConfigServiceProvider, projectsServiceProvider, persistServiceProvider, versionServiceProvider) {
				configServiceProvider.location("icsm/resources/config/config.json");
				placenamesConfigServiceProvider.location("icsm/resources/config/placenames.json");
            configServiceProvider.dynamicLocation("icsm/resources/config/appConfig.json?t=");
				versionServiceProvider.url("icsm/assets/package.json");
				projectsServiceProvider.setProject("icsm");
				persistServiceProvider.handler("local");
			}])

		.factory("userService", [function () {
			return {
				login: noop,
				hasAcceptedTerms: noop,
				setAcceptedTerms: noop,
				getUsername: function () {
					return "anon";
				}
			};
			function noop() { return true; }
		}])

		.controller("RootCtrl", RootCtrl);
}