/*!
 * Copyright 2016 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {

   'use strict';

   angular.module("elvis.reviewing", [])

      .directive('icsmReview', ['$rootScope', '$uibModal', '$log', 'reviewService',
         function ($rootScope, $uibModal, $log, reviewService) {
            return {
               controller: ['$scope', function ($scope, reviewService) {

               }],
               link: function (scope, element) {
                  var modalInstance;
                  scope.data = reviewService.data;

                  scope.$watch("data.reviewing", function (value) {
                     if (value) {
                        modalInstance = $uibModal.open({
                           templateUrl: 'icsm/reviewing/reviewing.html',
                           size: "lg",
                           backdrop: "static",
                           keyboard: false,
                           controller: ['$scope', '$uibModalInstance', 'products',
                              function ($scope, $uibModalInstance, products) {
                                 $scope.products = products;
                                 $scope.accept = function () {
                                    $uibModalInstance.close(true);
                                 };

                                 $scope.cancel = function () {
                                    $uibModalInstance.close(false);
                                 };

                                 $scope.noneSelected = function(products) {
                                    return !products.some(product => product.selected);
                                 }
                              }],
                           resolve: {
                              products: function () {
                                 return reviewService.products;
                              }
                           }
                        });
                        modalInstance.result.then(function (run) {
                           if(run) {
                              reviewService.startExtract().then(function() {
                                 console.log("Ran the data")
                              });
                           }
                           scope.data.reviewing = false;
                        }, function () {
                           $log.info('Cancelled');
                        });
                     }
                  });
               }
            };
         }])

      .directive("reviewEmail", ['reviewService', function (reviewService) {
         return {
            template: '<div class="input-group">' +
            '<span class="input-group-addon" id="nedf-email">Email</span>' +
            '<input required="required" type="email" ng-change="changeEmail(email)" ng-model="email" class="form-control" placeholder="Email address to send download link" aria-describedby="nedf-email">' +
            '</div>',
            restrict: "AE",
            link: function (scope, element) {
               reviewService.getEmail().then(function (email) {
                  scope.email = email;
               });

               scope.changeEmail = function (address) {
                  reviewService.setEmail(address);
               };
            }
         };
      }])

      .filter('reviewProductsSelected', function () {
         return function (products) {
            return products.filter(product => product.selected);
         };
      })

      .factory('reviewService', ['listService', 'persistService', function (listService, persistService) {
         var key = "elvis_download_email";
         var service = {
            get products() {
               return listService.products;
            },

            get data() {
               return listService.data;
            },

            startExtract: function() {
               var data = {
                  json: JSON.stringify(listService.products.filter(product => product.selected)),
                  maxx: 0,
                  maxy: 0,
                  minx: 0,
                  miny: 0,
                  email: this.data.email
               }
            },

            setEmail: function (email) {
               this.data.email = email;
               persistService.setItem(key, email);
            },

            getEmail: function () {
               return persistService.getItem(key).then(value => {
                  this.data.email = value;
                  return value;
               });
            },
         };

         return service;
      }]);


})(angular);
