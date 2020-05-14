/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */
{
   angular.module("explorer.clip.modal", [])

   .directive("clipModal", ['$document', '$animate', function($document, $animate) {
      return {
         restrict: 'EA',
          transclude: true,
          replace:true,
          scope: {
             title: '@',
             isOpen: '=',
            showClose: "="
          },
          templateUrl: 'icsm/clip/modal.html',
          link: function( scope, element ) {
             function keyupHandler(keyEvent) {
                if(keyEvent.which === 27) {
                   keyEvent.stopPropagation();
                   keyEvent.preventDefault();
                   scope.$apply(function() {
                       scope.isOpen = false;
                   });
                }
             }

             scope.$watch("isOpen", function(newValue) {
                if(newValue) {
                   $document.on('keyup', keyupHandler);
                } else {
                   $document.off('keyup', keyupHandler);
                }
                scope.$on('$destroy', function () {
                    $document.off('keyup', keyupHandler);
                });
             });
          }
      };
   }]);
}