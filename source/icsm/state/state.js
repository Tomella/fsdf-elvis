/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module('icsm.state', [])

.directive("icsmStateToggle", ['downloadService', function(downloadService) {
	return {
		restrict: 'AE',
		template : '<button ng-click="toggle(false)" ng-disabled="state.show" class="btn btn-default" title="Start downlaod selection."><i class="fa fa-lg fa-object-group"></i></button>',
		link: function(scope) {
			downloadService.data().then(function(data) {
				scope.state = data;
			});

			scope.toggle = function() {
				scope.state.show = !scope.state.show;
			};
		}
	};
}]);

})(angular);

