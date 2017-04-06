{

   class EmailService {
      constructor(persistService) {
         this.persistService = persistService;
         this.key = "download_email";
      }

      setEmail(email) {
         this.persistService.setItem(this.key, email);
      }

      getEmail() {
         return this.persistService.getItem(this.key);
      }
   }
   EmailService.$invoke = ["persistService"];

   angular.module("positioning.email", [])

      .directive("email", ["emailService", function (emailService) {
         return {
            template: '<div class="input-group">' +
            '<span class="input-group-addon" id="pos-email">Email</span>' +
            '<input required="required" type="email" ng-change="changeEmail(state.email)" ng-model="state.email" class="form-control" placeholder="Email address to send download link" aria-describedby="nedf-email">' +
            '</div>',
            restrict: "AE",
            scope: {
               state: "="
            },
            link: function (scope, element) {
               emailService.getEmail().then(function (email) {
                  scope.state.email = email;
               });

               scope.changeEmail = email => {
                  emailService.setEmail(email);
               }
            }
         };
      }])

      .service("emailService", EmailService);
}