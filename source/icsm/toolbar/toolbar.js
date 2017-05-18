{
angular.module("icsm.toolbar", [])

.directive("icsmToolbar", [function() {
	return {
		controller: 'toolbarLinksCtrl'
	};
}])


/**
 * Override the default mars tool bar row so that a different implementation of the toolbar can be used.
 */
.directive('icsmToolbarRow', [function() {
	return {
		scope:{
			map:"="
		},
		restrict:'AE',
		templateUrl:'icsm/toolbar/toolbar.html'
	};
}])

.directive('icsmToolbarInfo', [function() {
	return {
		templateUrl: 'radwaste/toolbar/toolbarInfo.html'
	};
}])

.controller("toolbarLinksCtrl", ["$scope", "configService", function($scope, configService) {
	configService.getConfig().then(config => {
		this.links = config.toolbarLinks;
	});

	$scope.item = "";
	$scope.toggleItem = function(item) {
		$scope.item = ($scope.item === item) ? "" : item;
	};

}]);

}