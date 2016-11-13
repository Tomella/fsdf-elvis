(function (angular) {

	'use strict';

	angular.module("IcsmApp", [
		'common.altthemes',
      'common.baselayer.control',
		'common.cc',
      'common.featureinfo',
		'common.header',
		'common.legend',
      'common.navigation',
		//'common.panes',
      'common.storage',
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

		//'geo.baselayer.control',
		'geo.draw',
		'geo.geosearch',
		'geo.map',
		'geo.maphelper',
		'geo.measure',

		'icsm.bounds',
		'icsm.clip',
		'icsm.glossary',
		'icsm.help',
		'icsm.panes',
		// Alternate list
		'elvis.header',
		'elvis.results',
		'elvis.reviewing',
      'icsm.mapevents',
		'icsm.select',
		'icsm.state',
		'icsm.templates',
		'icsm.view'
	])

		// Set up all the service providers here.
		.config(['configServiceProvider', 'projectsServiceProvider', 'persistServiceProvider', 'versionServiceProvider',
         function (configServiceProvider, projectsServiceProvider, persistServiceProvider, versionServiceProvider) {
				configServiceProvider.location("icsm/resources/config/config.json");
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