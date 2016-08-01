 (function(angular) {

'use strict';

angular.module('common.altthemes', [])

	/**
 	 *
 	 * Override the original mars user.
 	 *
  	 */
	.directive('altThemes', ['altthemesService', function(themesService) {
		return {
			restrict: 'AE',
			templateUrl: 'common/navigation/altthemes.html',
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

	.controller('altthemesCtrl', ['altthemesService', function(altthemesService) {
		this.service = altthemesService;
	}])

	.filter('altthemesFilter', function() {
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

	.factory('altthemesService', ['$q', 'configService', 'persistService', function($q, configService, persistService) {
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
