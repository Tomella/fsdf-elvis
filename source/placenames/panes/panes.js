/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {
'use strict';

class PaneCtrl {
   constructor(paneService) {
	   paneService.data().then(function(data) {
		   this.data = data;
	   }.bind(this));
   }
}
PaneCtrl.$inject = ["paneService"];

PaneService.$inject = [];
function PaneService() {
   var data = {
   };

   return {
      add: function (item) {
      },

      remove: function (item) {
		}
	};
}

angular.module("placenames.panes", [])

.directive("placenamesPanes", ['$rootScope', '$timeout', 'mapService', function($rootScope, $timeout, mapService) {
	return {
		templateUrl : "placenames/panes/panes.html",
		transclude : true,
		scope : {
			defaultItem : "@",
			data : "="
		},
		controller : ['$scope', function($scope) {
			var changeSize = false;

			$scope.view = $scope.defaultItem;

			$scope.setView = function(what) {
				var oldView = $scope.view;

				if($scope.view === what) {
					if(what) {
						changeSize = true;
					}
					$scope.view = "";
				} else {
					if(!what) {
						changeSize = true;
					}
					$scope.view = what;
				}

				$rootScope.$broadcast("view.changed", $scope.view, oldView);

				if(changeSize) {
					mapService.getMap().then(function(map) {
						map._onResize();
					});
				}
			};
			$timeout(function() {
				$rootScope.$broadcast("view.changed", $scope.view, null);
			},50);
		}]
	};
}])

.directive("placenamesTabs", [function() {
	return {
		templateUrl : "placenames/panes/tabs.html",
		require : "^placenamesPanes"
	};
}])

.controller("PaneCtrl", PaneCtrl)
.factory("paneService", PaneService);


})(angular);