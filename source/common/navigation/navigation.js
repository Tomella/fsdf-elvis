(function(angular) {
'use strict';

angular.module('common.navigation', [])
/**
 *
 * Override the original mars user.
 *
 */
.directive('commonNavigation', [function() {
	return {
		restrict: 'AE',
		template: "<alt-themes></alt-themes>",
		link: function(scope) {
			scope.username = "Anonymous";
		}
	};
}])

.factory('navigationService', [function() {
	return {};
}]);

})(angular);
