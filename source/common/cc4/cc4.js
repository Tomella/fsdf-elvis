
(function(angular) {

'use strict';

angular.module("common.cc4", [])

.directive('commonCc4', [function() {
   return {
      templateUrl: 'common/cc4/cc4.html',
      link: function(scope) {
         scope.template = 'common/cc4/cc4template.html';
      }
   };
}]);

})(angular);
