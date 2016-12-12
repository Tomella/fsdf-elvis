
(function (angular) {

	'use strict';

	angular.module('placenames.header', [])

		.controller('headerController', ['$scope', '$q', '$timeout', function ($scope, $q, $timeout) {

			var modifyConfigSource = function (headerConfig) {
				return headerConfig;
			};
			$scope.$on('headerUpdated', function (event, args) {
				$scope.headerConfig = modifyConfigSource(args);
			});
		}])

		.directive('placenamesHeader', [function () {
			var defaults = {
				heading: "Place Names",
				headingtitle: "Place Names",
				helpurl: "help.html",
				helptitle: "Get help about Place Names",
				helpalttext: "Get help about Place Names",
				skiptocontenttitle: "Skip to content",
				skiptocontent: "Skip to content",
				quicklinksurl: "/search/api/quickLinks/json?lang=en-US"
			};
			return {
				transclude: true,
				restrict: 'EA',
				templateUrl: "placenames/header/header.html",
				scope: {
					breadcrumbs: "=",
					heading: "=",
					headingtitle: "=",
					helpurl: "=",
					helptitle: "=",
					helpalttext: "=",
					skiptocontenttitle: "=",
					skiptocontent: "=",
					quicklinksurl: "="
				},
				link: function (scope, element, attrs) {
					var data = angular.copy(defaults);
					angular.forEach(defaults, function (value, key) {
						if (!(key in scope)) {
							scope[key] = value;
						}
					});
				}
			};
		}])

		.factory('headerService', ['$http', function () {
		}]);

})(angular);
