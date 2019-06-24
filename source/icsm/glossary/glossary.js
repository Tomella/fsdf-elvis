{
   angular.module("icsm.glossary", [])

      .directive("icsmGlossary", [function () {
         return {
            templateUrl: "icsm/glossary/glossary.html"
         };
      }])

      .controller("GlossaryCtrl", GlossaryCtrl)
      .factory("glossaryService", GlossaryService);

   GlossaryCtrl.$inject = ['$log', 'glossaryService'];
   function GlossaryCtrl($log, glossaryService) {
      $log.info("GlossaryCtrl");
      glossaryService.getTerms().then(terms => {
         this.terms = terms;
      });
   }

   GlossaryService.$inject = ['$http'];
   function GlossaryService($http) {
      var TERMS_SERVICE = "icsm/resources/config/glossary.json";

      return {
         getTerms: function () {
            return $http.get(TERMS_SERVICE, { cache: true }).then(function (response) {
               return response.data;
            });
         }
      };
   }
}