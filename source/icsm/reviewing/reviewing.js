/*!
 * Copyright 2016 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {

   'use strict';

   angular.module("elvis.reviewing", [])

      .directive('icsmReview', ['$rootScope', '$uibModal', '$log', 'messageService', 'reviewService',
         function ($rootScope, $uibModal, $log, messageService, reviewService) {
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

                                 $scope.noneSelected = function (products) {
                                    return !products.some(product => product.selected);
                                 };
                              }],
                           resolve: {
                              products: function () {
                                 return reviewService.products;
                              }
                           }
                        });
                        modalInstance.result.then(function (run) {
                           if (run) {
                              reviewService.startExtract().then(response => {
                                 messageService[response.status](response.message);
                                 reviewService.removeRemoved();
                                 scope.data.reviewing = false;
                              });
                           }
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
            '<input required="required" type="email" ng-model="data.email" class="form-control" placeholder="Email address to send download link" aria-describedby="nedf-email">' +
            '</div>',
            restrict: "AE",
            link: function (scope, element) {
               scope.data = reviewService.data;
               console.log("data" + scope.data);
            }
         };
      }])

      .filter('reviewProductsSelected', function () {
         return function (products) {
            return products.filter(product => product.selected);
         };
      })

      .factory('reviewService', ['$http', 'clipService', 'configService', 'listService', 'persistService',
                        function ($http, clipService, configService, listService, persistService) {
         var key = "elvis_download_email";
         var data = listService.data;
         var service = {
            data: listService.data,
            get products() {
               return listService.products;
            },

            startExtract: function () {
               var clip = clipService.data.clip;
               this.setEmail(data.email);

               return configService.getConfig("processing").then(function(config) {
                  if(config.method === 'POST') {
                     let postData = convertFlatToStructured(listService.products.filter(product => product.selected && !product.removed));
                     postData.parameters = {
                        xmin: clip.xMin,
                        xmax: clip.xMax,
                        ymin: clip.yMin,
                        ymax: clip.yMax,
                        email: data.email
                     };

                     listService.products.forEach(product => {
                        product.selected = product.removed = false;
                     });

                     return $http({
                        method: 'POST',
                        url: config.postProcessingUrl,
                        data: postData,
                        headers: { "Content-Type": "application/json" }
                     }).then(function(response) {
                        return {
                           status: "success",
                           message: "Your job has been submitted. An email will be sent on job completion."
                        };
                     }, function(d) {
                        return {
                           status: "error",
                           message: "Sorry but the service failed to respond. Try again later."
                        };
                     });
                  } else {
                     let getData = {
                        json: JSON.stringify(convertFlatToStructured(listService.products.filter(product => product.selected && !product.removed))),
                        maxx: clip.xMax,
                        maxy: clip.yMax,
                        minx: clip.xMin,
                        miny: clip.yMin,
                        email: data.email
                     };
                     $("#launcher")[0].src = transformTemplate(config.processingUrl, getData);

                     listService.products.forEach(product => {
                        product.selected = product.removed = false;
                     });

                     return {
                        status: "success",
                        message: "Your job has been submitted. An email will be sent on job completion."
                     };
                  }
               });
            },

            removeRemoved: function() {
               listService.products.forEach(product => {
                  product.removed = false;
               });
            },

            setEmail: function (email) {
               this.data.email = email;
               persistService.setItem(key, email);
            }
         };

         persistService.getItem(key).then(value => {
            service.data.email = value;
         });

         return service;
      }]);

   function transformTemplate(template, data) {
      var response = template;
      angular.forEach(data, function(value, key) {
         response = response.replace("{" + key + "}", encodeURIComponent(value));
      });
      return response;
   }

   function convertFlatToStructured(flat) {
      var fields = ["file_url", "file_name", "file_size", "bbox"]; // ["index_poly_name", "file_name", "file_url", "file_size", "file_last_modified", "bbox"]
      var response = {
         available_data: []
      };
      var available = response.available_data;
      var sourceMap = {};

      flat.forEach(dataset => {
         var item = {};
         fields.forEach(field => {
            if(typeof dataset[field] !== "undefined") {
               item[field] = dataset[field];
            }
         });

         var data = sourceMap[dataset.source];
         if(!data) {
            data = {
               source: dataset.source,
               downloadables : {}
            };
            sourceMap[dataset.source] = data;
            available.push(data);
         }

         var downloadable = data.downloadables[dataset.type];
         if(!downloadable) {
            downloadable = {};
            data.downloadables[dataset.type] = downloadable;
         }

         var group = downloadable[dataset.group];
         if(!group) {
            group = [];
            downloadable[dataset.group] = group;
         }

         group.push(item);
      });

      return response;
   }

})(angular);
