{
   angular.module('positioning.download', [])
      /**
       *
       * Override the original mars user.
       *
       */
      .directive('posDownload', [function () {
         return {
            restrict: 'AE',
            templateUrl: 'positioning/download/download.html',
            link: function (scope) {
            }
         };
      }]);
}