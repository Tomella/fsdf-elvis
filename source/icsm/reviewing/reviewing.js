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
                           controller: ['$scope', '$uibModalInstance', 'listService', 'products', 'vcRecaptchaService',
                              function ($scope, $uibModalInstance, listService, products, vcRecaptchaService) {
                                 $scope.recaptchaKey = "6LfUrFsUAAAAAKu4EJY_FSi3zFXvWm60RDVknRHf";
                                 let selected = scope.selected = products.filter(product => product.selected)
                                 scope.derived = selected.filter(selection => selection.product);

                                 listService.getMappings().then(function (response) {
                                    $scope.mappings = response;
                                 });

                                 $scope.products = convertFlatToStructured(selected).available_data;

                                 $scope.accept = function () {
                                    $uibModalInstance.close($scope.recaptchaResponse, $scope.products);
                                 };

                                 $scope.cancel = function () {
                                    $uibModalInstance.close(null);
                                 };

                                 $scope.setWidgetId = function(widgetId) {
                                    $scope.recaptchaId = widgetId;
                                 };

                                 $scope.setResponse = function(response) {
                                    $scope.recaptchaResponse = response;
                                 };

                                 $scope.cbExpiration = function() {
                                    vcRecaptchaService.reload($scope.recaptchaId);
                                    $scope.recaptchaResponse = null;
                                 };

                              }],
                           resolve: {
                              products: function () {
                                 return reviewService.products;
                              }
                           }
                        });
                        modalInstance.result.then(function (recaptchaResponse) {
                           delete scope.data.recaptchaResponse;
                           if (recaptchaResponse) {
                              scope.data.recaptchaResponse = recaptchaResponse;
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

         .directive('reviewIndustry', ["configService", "reviewService", function (configService, reviewService ) {
            return {
               retrict: "AE",
               template: '<div class="input-group">' +
               '<span class="input-group-addon" style="width:6em" id="nedf-industry">Industry</span>' +
               '<select required="required" type="text" ng-options="ind.text for ind in industries" ng-model="data.industry" class="form-control" placeholder="Industry of interest for this data" aria-describedby="nedf-industry">' +
               '</select></div>',
               link: function(scope) {
                  scope.data = reviewService.data;
                  configService.getConfig("industries").then(list => {
                     scope.industries = list;
                  });
               }
            }
         }])

      .directive("reviewEmail", ['reviewService', function (reviewService) {
         return {
            template: '<div class="input-group">' +
               '<span class="input-group-addon" style="width:6em" id="nedf-email">Email</span>' +
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
            const EMAIL_KEY = "elvis_download_email";
            const INDUSTRY_KEY = "elvis_download_industry";
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
                  this.setEmail(data.email);
                  this.setIndustry(data.industry);
                  return configService.getConfig("processing").then(function (config) {

                     var clip = clipService.data.clip;

                     console.log("We are processing files");
                     return postFiles();

                     function postFiles() {
                        let postData = convertFlatToStructured(listService.products.filter(
                           product => product.selected)
                        );

                        postData.parameters = {
                           xmin: clip.xMin,
                           xmax: clip.xMax,
                           ymin: clip.yMin,
                           ymax: clip.yMax,
                           email: data.email,
                           industry: data.industry.code,
                           recaptcha: data.recaptchaResponse
                        };

                        if (data.outCoordSys) {
                           postData.parameters.outCoordSys = data.outCoordSys.code;
                        }

                        if (data.outFormat) {
                           postData.parameters.outFormat = data.outFormat.code;
                        }

                        listService.products.forEach(product => {
                           product.selected = product.removed = false;
                        });

                        return $http({
                           method: 'POST',
                           url: config.postProcessingUrl,
                           data: postData,
                           headers: { "Content-Type": "application/json" }
                        }).then(function (response) {
                           return response.data;
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
                  persistService.setItem(EMAIL_KEY, email);
               },

               setIndustry: function (industry) {
                  this.data.industry = industry;
                  if(industry && industry.code) {
                     persistService.setItem(INDUSTRY_KEY, industry.code);
                  }
               },

               clipProduct() {

               }
            };

            persistService.getItem(EMAIL_KEY).then(value => {
               service.data.email = value;
            });

            persistService.getItem(INDUSTRY_KEY).then(code => {
               if(code) {
                  configService.getConfig("industries").then(list => {
                     service.data.industry = list.find(item => item.code === code);
                  });
               }
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
      var fields = ["file_url", "file_name", "project_name", "product", "metadata_id", "file_size", "bbox"]; // ["index_poly_name", "file_name", "file_url", "file_size", "file_last_modified", "bbox"]
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
