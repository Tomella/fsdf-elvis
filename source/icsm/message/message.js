{
   angular.module("icsm.message", [])

      .directive("icsmMessage", ['icsmMessageService', function (icsmMessageService) {
         return {
            templateUrl: "icsm/message/message.html",
            link: function (scope, element) {
               scope.message = icsmMessageService.data;
            }
         };
      }])

      .factory("icsmMessageService", ['$timeout',
         function ($timeout) {
            let data = {};
            let service = {
               get data() {
                  return data;
               },

               wait: text => {
                  return service.message("wait", text);
               },

               info: text => {
                  return service.message("info", text);
               },

               warn: text => {
                  return service.message("warn", text);
               },

               error: text => {
                  return service.message("error", text);
               },

               clear: () => {
                  return service.message(null, null);
               },

               message: (type, text) => {
                  data.type = type;
                  data.text = text;
                  $timeout(() => {
                     service.removeFlash();
                  }, 100000)
               },

               flash: text => {
                  return service.message("flash", text);
               },

               removeFlash: () => {
                  data.type = null;
               }
            };

            return service;
         }
      ]);
}