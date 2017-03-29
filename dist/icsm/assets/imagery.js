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

	angular.module("ImageryApp", ['common.altthemes', 'common.header', 'common.navigation', 'common.storage', 'common.templates', 'common.toolbar', 'explorer.config', 'explorer.confirm', 'explorer.drag', 'explorer.enter', 'explorer.flasher', 'explorer.googleanalytics', 'explorer.httpdata', 'explorer.info', 'explorer.message', 'explorer.modal', 'explorer.tabs', 'explorer.version', 'exp.ui.templates', 'ui.bootstrap', 'ui.bootstrap-slider', 'ngAutocomplete', 'ngRoute', 'ngSanitize', 'page.footer'])

	// Set up all the service providers here.
	.config(['configServiceProvider', 'projectsServiceProvider', 'versionServiceProvider', function (configServiceProvider, projectsServiceProvider, versionServiceProvider) {
		configServiceProvider.location("icsm/resources/config/config.json");
		configServiceProvider.dynamicLocation("icsm/resources/config/appConfig.json?t=");
		versionServiceProvider.url("icsm/assets/package.json");
		projectsServiceProvider.setProject("icsm");
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

	RootCtrl.$invoke = ['$http', 'configService'];
	function RootCtrl($http, configService) {
		var self = this;
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