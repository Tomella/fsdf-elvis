(function(angular) {
'use strict';

angular.module('start.navigation', [])
/**
 *
 * Override the original mars user.
 *
 */
.directive('startNavigation', ['altthemesService', function(altthemesService) {
	return {
		restrict: 'AE',
		templateUrl: 'start/navigation/navigation.html',
		link: function(scope) {
         altthemesService.getThemes().then(themes => {
            scope.themes = themes;
         });
			scope.username = "Anonymous";
		}
	};
}]);

})(angular);
