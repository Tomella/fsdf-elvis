(function(angular) {
'use strict';

angular.module('start.navigation', [])
/**
 *
 * Override the original mars user.
 *
 */
.directive('startNavigation', [function() {
	return {
      scope: {
         data: "="
      },
		restrict: 'AE',
		templateUrl: 'start/navigation/navigation.html',
		link: function(scope) {
			scope.username = "Anonymous";
		}
	};
}]);

})(angular);
