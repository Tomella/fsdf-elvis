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
      'common.reset',
      "common.side-panel",
      'common.slider',
      'common.storage',
      'common.templates',

		'elvis.results',
      'elvis.reviewing',

      'explorer.config',
      'explorer.confirm',
		'explorer.drag',
		'explorer.enter',
      'explorer.flasher',
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

		'geo.draw',
		'geo.elevation',
		'geo.geosearch',
		'geo.map',
		'geo.maphelper',
      'geo.measure',

		'icsm.bounds',
      'icsm.clip',
      'icsm.contributors',
      'icsm.coverage',
      'icsm.elevation.point',
		'icsm.glossary',
		'icsm.header',
      'icsm.help',
      'icsm.imagery',
      'icsm.layerswitch',
      'icsm.mapevents',
		'icsm.panes',
      "icsm.parameters",
      "icsm.polygon",
		'icsm.point',
      'icsm.products',
      'icsm.preview',
		'icsm.select',
		'icsm.splash',
		'icsm.templates',
		'icsm.toolbar',
      'icsm.view',

      'ngAutocomplete',
		'ngRoute',
		'ngSanitize',

      'page.footer',

      'placenames.search',
      'placenames.config',
      'placenames.summary',

		'ui.bootstrap',

      'vcRecaptcha'
	])

		// Set up all the service providers here.
		.config(['$locationProvider', 'configServiceProvider', 'placenamesConfigServiceProvider', 'projectsServiceProvider', 'persistServiceProvider', 'versionServiceProvider',
         function ($locationProvider, configServiceProvider, placenamesConfigServiceProvider, projectsServiceProvider, persistServiceProvider, versionServiceProvider) {
            $locationProvider.html5Mode({
               enabled: true,
               requireBase: false
            });
				configServiceProvider.location("icsm/resources/config/config.json?v=a");
				placenamesConfigServiceProvider.location("icsm/resources/config/placenames.json");
            //configServiceProvider.dynamicLocation("icsm/resources/config/appConfig.json?t=");
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