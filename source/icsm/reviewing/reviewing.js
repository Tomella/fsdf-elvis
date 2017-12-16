{

   angular.module("elvis.reviewing", [])

      .directive('icsmReview', ['$rootScope', '$uibModal', '$log', 'messageService', 'reviewService',
         function ($rootScope, $uibModal, $log, messageService, reviewService) {
            return {
               link: function (scope, element) {
                  var modalInstance;
                  scope.data = reviewService.data;

                  // TODO: Why is this here? What is trying to override data?
                  scope.$watch("data", function (value, old) {
                     if (old) {
                        console.log("Why?", value);
                        scope.data = reviewService.data;
                     }
                  });

                  scope.$watch("data.reviewing", function (value) {
                     if (value) {
                        modalInstance = $uibModal.open({
                           templateUrl: 'icsm/reviewing/reviewing.html',
                           size: "lg",
                           backdrop: "static",
                           keyboard: false,
                           controller: ['$scope', '$uibModalInstance', 'listService', 'products',
                              function ($scope, $uibModalInstance, listService, products) {

                                 listService.getMappings().then(function (response) {
                                    $scope.mappings = response;
                                 });

                                 $scope.products = convertFlatToStructured(products.filter(
                                    product => product.selected)).available_data;

                                 $scope.accept = function () {
                                    $uibModalInstance.close(true, $scope.products);
                                 };

                                 $scope.cancel = function () {
                                    $uibModalInstance.close(false);
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
                           reviewService.removeRemoved();
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
               '<input required="required" type="email" ng-model="data.email" class="form-control" placeholder="Email address to send download link" aria-describedby="nedf-email">' +
               '</div>',
            restrict: "AE",
            link: function (scope, element) {
               scope.data = reviewService.data;
               //console.log("data" + scope.data);
            }
         };
      }])

      .filter('reviewProductsSelected', function () {
         return function (products) {
            return products.filter(product => product.selected);
         };
      })

      .filter('reviewSumSize', function () {
         return function (products) {
            return products.reduce((sum, product) => sum + (product.file_size ? +product.file_size : (product.product ? 500000000 : 0)), 0);
         };
      })

      .factory('reviewService', ['$http', '$q', 'clipService', 'configService', 'listService', 'persistService',
         function ($http, $q, clipService, configService, listService, persistService) {
            var key = "elvis_download_email";
            var data = listService.data;
            var service = {
               get data() {
                  return data;
               },

               set data(data) {
                  console.log("What the hell!")
                  data;
               },

               get products() {
                  return listService.products;
               },

               startExtract: function () {
                  var clip = clipService.data.clip;
                  this.setEmail(data.email);

                  return configService.getConfig("processing").then(function (config) {
                     let selected = listService.products.filter(product => product.selected);
                     let products = selected.filter(product => product.product);
                     let files = selected.filter(product => !product.product);
                     let jobsCount = 0;

                     var template = "https://elvis20161a-ga.fmecloud.com/fmejobsubmitter/elvis_prod/DEMClipZipShip_Master_S3Source.fmw?geocat_number=${id}&out_grid_name=${filename}&input_coord_sys=LL-WGS84&ymin=${yMin}&ymax=${yMax}&xmin=${xMin}&xmax=${xMax}&output_format=${outFormat}&out_coord_sys=${outCoordSys}&email_address=${email}&opt_showresult=false&opt_servicemode=async";

                     if (products.length) {
                        console.log("We are processing products.");
                        let index = 0;

                        return submit();

                        function submit() {
                           jobsCount++;

                           let product = products[index++];
                           let parameters = Object.assign({}, clip, {
                              id: product.metadata_id,
                              filename: "",
                              outFormat: data.outFormat.code,
                              outCoordSys: data.outCoordSys.code,
                              email: data.email
                           });

                           return postProduct(template, parameters).then(response => {
                              if (index < products.length) {
                                 return submit();
                              } else {
                                 // Clear selections
                                 products.forEach(product => product.selected = false);
                                 if (files.length) {
                                    return postFiles();
                                 } else {
                                    return finish();
                                 }
                              }
                           });
                        }

                     }

                     if (!products.length && files.length) {
                        console.log("We are processing files");
                        return postFiles();
                     }

                     // That's the job done.

                     function postProduct(template, parameters) {
                        let workingString = template;

                        angular.forEach(parameters, function (item, key) {
                           workingString = workingString.replace("${" + key + "}", item);
                        });

                        return $http({
                           method: 'GET',
                           url: workingString
                        }).then(function (response) {
                           return finish();
                        }, function (d) {
                           return {
                              status: "error",
                              message: "Sorry but the service failed to respond. Try again later."
                           };
                        });
                     }

                     function finish() {
                        return {
                           status: "success",
                           message: jobsCount > 1 ? ("Your jobs have been submitted. You will receive " + jobsCount + " emails with the results soon.") : "Your job has been submitted. You will receive an email with the results soon."
                        };
                     }

                     function postFiles() {
                        jobsCount++;
                        let postData = convertFlatToStructured(listService.products.filter(
                           product => (product.selected && !product.product) || product.type === "Unreleased Data")
                        );

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
                        }).then(function (response) {
                           return finish();
                        }, function (d) {
                           return {
                              status: "error",
                              message: "Sorry but the service failed to respond. Try again later."
                           };
                        });
                     }
                  });
               },

               removeRemoved: function () {
                  listService.products.forEach(product => {
                     product.removed = false;
                  });
               },

               setEmail: function (email) {
                  this.data.email = email;
                  persistService.setItem(key, email);
               },

               clipProduct() {

               }
            };

            persistService.getItem(key).then(value => {
               service.data.email = value;
            });

            return service;
         }]);

   function transformTemplate(template, data) {
      var response = template;
      angular.forEach(data, function (value, key) {
         response = response.replace("{" + key + "}", encodeURIComponent(value));
      });
      return response;
   }

   function convertFlatToStructured(flat) {
      var fields = ["file_url", "file_name", "project_name", "product", "file_size", "bbox"]; // ["index_poly_name", "file_name", "file_url", "file_size", "file_last_modified", "bbox"]
      var response = {
         available_data: []
      };
      var available = response.available_data;
      var sourceMap = {};

      flat.forEach(dataset => {
         var item = {};
         fields.forEach(field => {
            if (typeof dataset[field] !== "undefined") {
               item[field] = dataset[field];
            }
         });

         var data = sourceMap[dataset.source];
         if (!data) {
            data = {
               source: dataset.source,
               downloadables: {}
            };
            sourceMap[dataset.source] = data;
            available.push(data);
         }

         var downloadable = data.downloadables[dataset.type];
         if (!downloadable) {
            downloadable = {};
            data.downloadables[dataset.type] = downloadable;
         }

         var group = downloadable[dataset.group];
         if (!group) {
            group = [];
            downloadable[dataset.group] = group;
         }

         group.push(item);
      });

      return response;
   }

}
