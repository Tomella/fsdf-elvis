{
   angular.module("positioning.mandatory", [])

   .directive("mandatory", function() {
      return {
         template: '<span class="mandatory" title="You must provide a value">*</span>'
      };
   });
}