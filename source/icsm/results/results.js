{

   angular.module("elvis.results", ['elvis.results.continue', 'icsm.subtype', 'icsm.unreleased'])

      .directive('icsmOrgHeading', [function () {
         return {
            templateUrl: 'icsm/results/orgheading.html',
            restrict: 'AE',
            scope: {
               org: "=",
               mappings: "="
            }
         };
      }])

      .directive('icsmList', ['$rootScope', 'listService', function ($rootScope, listService) {
         return {
            templateUrl: 'icsm/results/results.html',
            link: function (scope) {
               listService.getMappings().then(function (response) {
                  scope.mappings = response;
               });

               scope.filters = listService.data;

               scope.update = function () {
                  var filterExists = !!scope.filters.filter;
                  var types = [];

                  var typesExists = scope.filters.types.some(type => type.selected) && !scope.filters.types.every(type => type.selected);
                  // Set up the default
                  scope.products.forEach(function (product) {
                     product.matched = !filterExists;
                  });

                  // Do the types first
                  if (typesExists) {
                     scope.products.forEach(function (product) {
                        product.matched = false;
                        scope.filters.types.filter(type => type.selected).forEach(type => {
                           if (type.match && type.match[product.type]) {
                              product.matched = true;
                           } else if (type.noMatch && !type.noMatch[product.type]) {
                              product.matched = true;
                           }
                        });
                     });
                  }

                  // Now do the filters
                  if (filterExists) {
                     var upperFilter = scope.filters.filter.toUpperCase();
                     var products = scope.products;
                     if (typesExists) {
                        products = products.filter(item => item.matched);
                     }

                     products.forEach(function (product) {
                        let name = product.file_name || product.project_name || "";
                        product.matched = name.toUpperCase().indexOf(upperFilter) > -1;
                     });
                  }
                  scope.$broadcast("filter.changed")
               };

               scope.show = function (data) {
                  var bbox = toNumberArray(data.bbox);
                  $rootScope.$broadcast('icsm.bbox.draw', bbox);
               };

               scope.hide = function (data) {
                  $rootScope.$broadcast('icsm.bbox.draw', null);
               };

               $rootScope.$on("clip.initiate.draw", function (event, data) {
                  scope.list = null;
                  scope.products = [];
                  scope.productsMap = [];
               });

               $rootScope.$on('site.selection', function (event, data) {
                  scope.list = null;
                  scope.products = [];
                  scope.productsMap = [];

                  if (data.available_data) {
                     scope.list = data.available_data.filter(function (org) {
                        return org.downloadables;
                     });

                     scope.list.forEach(function (org) {
                        angular.forEach(org.downloadables, function (types, type) {
                           angular.forEach(types, function (group, groupType) {
                              group.forEach(function (product) {
                                 product.source = org.source;
                                 product.group = groupType;
                                 product.type = type;
                                 scope.productsMap[product.file_url] = product;
                                 scope.products.push(product);
                              });
                           });
                        });
                     });
                     listService.products = scope.products;
                  }
                  scope.update();
               });

               scope.show = function (data) {
                  var bbox = toNumberArray(data.bbox);
                  $rootScope.$broadcast('icsm.bbox.draw', bbox);
               };

               scope.hide = function (data) {
                  $rootScope.$broadcast('icsm.bbox.draw', null);
               };

               function decorateCounts(list, types) {
                  // reset
                  var checks = [];
                  angular.forEach(types, function (type) {
                     type.count = 0;
                     checks.push(type);
                  });

                  if (list) {
                     list.forEach(function (item) {
                        item.downloadables.forEach(function (downloadable) {
                           checks.forEach(function (check) {
                              check.count += downloadable[check.countField] ? 1 : 0;
                           });
                        });
                     });
                  }
               }

               function toNumberArray(numbs) {
                  if (angular.isArray(numbs) || !numbs) {
                     return numbs;
                  }
                  return numbs.split(/,\s*/g).map(function (numb) {
                     return +numb;
                  });
               }
            }
         };
      }])

      .directive('icsmAbstract', ['listService', function (listService) {
         return {
            templateUrl: "icsm/results/abstractbutton.html",
            scope: {
               item: "="
            },
            link: function (scope) {
               scope.show = listService.hasMetadata(scope.item);

               scope.toggle = function () {
                  scope.item.showAbstract = !scope.item.showAbstract;
                  if (scope.item.showAbstract) {
                     load();
                  }
               };

               function load() {
                  if (!scope.fetched) {
                     scope.fetched = true;
                     listService.getMetadata(scope.item).then(data => {
                        scope.item.metadata = data;
                     });
                  }
               }
            }
         };
      }])

      // All this does is set up the data on mouse hover. The UI can do whatever it wants with the data when it arrives
      .directive('icsmAbstractHover', ['$timeout', 'listService', function ($timeout, listService) {
         const TIME_DELAY = 250; // ms
         return {
            restrict: 'AE',
            scope: {
               item: "="
            },
            link: function (scope, element) {
               var promise;

               element.on('mouseenter', function () {
                  if (promise) {
                     $timeout.cancel(promise);
                  }
                  promise = $timeout(load, TIME_DELAY);
               });

               element.on('mouseleave', function () {
                  if (promise) {
                     $timeout.cancel(promise);
                     promise = null;
                  }
               });

               function load() {
                  if (!scope.fetched) {
                     scope.fetched = true;
                     listService.getMetadata(scope.item).then(data => {
                        scope.item.metadata = data;
                     });
                  }
               }
            }
         };
      }])

      // All this does is set up the data on mouse hover. The UI can do whatever it wants with the data when it arrives
      .directive('icsmAbstractLink', ['$timeout', 'listService', function ($timeout, listService) {

         return {
            restrict: 'AE',
            template: "<a target='_blank' ng-if='url' ng-href='{{url}}'>{{item[name]}}</a><span ng-if='!url' ng-bind='item.file_name'></span>",
            scope: {
               item: "=",
               name: "@?"
            },
            link: function (scope, element) {
               if (!scope.name) {
                  scope.name = "file_name";
               }

               let data = {
                  file_name: scope.item[scope.name],
                  metadata_url: scope.item.metadata_url,
                  source: scope.item.source
               };
               scope.url = listService.getLink(data);
            }
         };
      }])


      .controller('listCtrl', ListCtrl)

      .factory('listService', ['$http', function ($http) {
         var service = {};
         var expansions = {};

         var strategies = new Strategies($http);

         service.data = {
            id:"listService_data",
            filter: "",
            types: [],
         };

         $http.get('icsm/resources/config/filetypes.json').then(function (response) {
            service.data.typesMap = response.data;
            service.data.types = [];
            angular.forEach(response.data, function (value, key) {
               service.data.types.push(value);
            });
         });

         service.getMetadata = function (item) {
            return strategies.strategy(item.source).requestMetadata(item);
         };


         service.hasMetadata = function (item) {
            return strategies.strategy(item.source).hasMetadata(item);
         };

         service.getLink = function (item) {
            return strategies.strategy(item.source).constructLink(item);
         };

         service.getMappings = function () {
            return $http.get('icsm/resources/config/list.json').then(function (response) {
               return response.data;
            });
         };
         return service;
      }])

      .filter("allowedTypes", ['listService', function (listService) {
         return function (types) {
            if (!listService.data.types.some(type => type.selected)) {
               return types;
            }
            var response = {};
            angular.forEach(types, function (item, key) {
               if (listService.data.typesMap && listService.data.typesMap[key] && listService.data.typesMap[key].selected) {
                  response[key] = item;
               }
            });
            return response;
         };
      }])

      .filter("countMatchedDownloadables", function () {
         return function (downloadables) {
            if (!downloadables) {
               return "-";
            } else {
               var count = 0;
               angular.forEach(downloadables, function (types, key) {
                  if (!Array.isArray(types)) {
                     angular.forEach(types, function (items) {
                        count += items.filter(item => item.matched).length;
                     });
                  }
               });
               return count;
            }
         };
      })

      .filter("countMatchedItems", function () {
         return function (items) {
            if (!items) {
               return "";
            } else {
               return items.filter(item => item.matched).length;
            }
         };
      })

      .filter("hasTypeMatches", function () {
         return function (types) {
            if (!types) {
               return false;
            }
            var count = 0;
            Object.keys(types).forEach(key => {
               count += types[key].filter(item => item.matched).length;
            })
            return count > 0;
         };
      })

      .filter("matchedTypes", function () {
         return function (obj) {
            var response = {};
            angular.forEach(obj, function (group, key) {
               if (group.some(item => item.matched)) {
                  response[key] = group;
               }
            });
            return response;
         };
      })

      .filter("matchedGroups", [function () {
         return function (obj) {
            var response = {};
            if (obj) {
               angular.forEach(obj, function (group, key) {
                  if (group.some(item => item.matched)) {
                     response[key] = group;
                  }
               });
            }
            return response;
         };
      }])

      .filter("matchedItems", function () {
         return function (list) {
            return list.filter(item => item.matched);
         };
      })

      .filter("keysLength", [function () {
         return function (list) {
            if (!list) {
               return 0;
            }
            return Object.keys(list).reduce((sum, key) => sum + list[key].length, 0);
         };
      }])

      .filter("countDownloadables", function () {
         return function (downloadables) {
            if (!downloadables) {
               return "-";
            } else {
               var count = 0;
               angular.forEach(downloadables, function (group, key) {
                  angular.forEach(group, function (value, key) {
                     count += value.length;
                  });
               });
               return count;
            }
         };
      })

      .filter('fileSize', function () {
         return fileSize;
      });

   function fileSize(size) {
      var meg = 1000 * 1000;
      var gig = meg * 1000;
      var ter = gig * 1000;

      if (!size) {
         return "-";
      }

      if (("" + size).indexOf(" ") > -1) {
         return size;
      }

      size = parseFloat(size);

      if (size < 1000) {
         return size + " bytes";
      }
      if (size < meg) {
         return (size / 1000).toFixed(1) + " kB";
      }
      if (size < gig) {
         return (size / meg).toFixed(1) + " MB";
      }
      if (size < ter) {
         return (size / gig).toFixed(1) + " GB";
      }
      return (size / ter).toFixed(1) + " TB";
   }

   ListCtrl.$inject = ['listService'];
   function ListCtrl(listService) {
      this.service = listService;

      this.checkChildren = function (children) {
         var allChecked = this.childrenChecked(children);
         let filtered = children;
         if (!allChecked) {
            filtered = children.filter(child => child.matched);
         }
         filtered.forEach(child => {
            if (allChecked) {
               delete child.selected;
            } else {
               child.selected = true;
            }
         });
      };

      this.childrenChecked = function (children) {
         return !children.filter(child => child.matched).some(child => !child.selected);
      };

      this.someMatches = function (products) {
         var matches = false;
         angular.forEach(products.downloadables, function (group) {
            angular.forEach(group, function (subGroup) {
               matches |= subGroup.some(item => item.matched);
            });
         });
         return matches;
      };


      this.someChildMatches = function (downloadables) {
         var matches = false;
         angular.forEach(group, function (subGroup) {
            matches |= subGroup.some(item => item.matched);
         });
         return matches;
      };

      this.review = function () {
         this.service.data.reviewing = true;
      };

      this.cancelReview = function () {
         this.service.data.reviewing = false;
      };
   }

   ListCtrl.prototype = {
      get products() {
         return this.service.products;
      },

      get selectedSize() {
         var products = this.service.products;

         return (products ? products.filter(item => item.selected && !item.removed) : []
         ).map(product => {
            return product.file_size ? (+product.file_size) : 500000000;
         }).reduce((prev, curr) => {
            return prev + curr;
         }, 0);
      },

      get selected() {
         var products = this.service.products;
         return products ? products.filter(item => item.selected && !item.removed) : [];
      }
   };

}