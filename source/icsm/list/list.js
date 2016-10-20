/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("icsm.list", [])

.directive('icsmList', ['$rootScope', 'listService', function($rootScope, listService) {
	return {
		templateUrl: 'icsm/list/list.html',
		link: function(scope) {
         listService.getMappings().then(function(response) {
            scope.mappings = response;
         });

         listService.getFiletypes().then(function(response) {
            scope.filetypes = response;
         });
         scope.filter = "";

         scope.matched = function() {
            var count = 0;
            if(scope.list) {
               scope.list.forEach(function(item) {
                  count += item.downloadables.length;
               });
            }
            return count;
         };

         scope.fullCount = function(name) {
            var count = 0;
            scope.list.forEach(function(available) {
               if(available.source == name) {
                  count = available.downloadables.length;
               }
            });
            return count;
         };

         scope.update = function() {
            var filteredText =  filterText(scope.list, scope.filter);
            scope.filteredList =  filterTypes(filteredText, scope.filetypes);
            scope.typeCounts = decorateCounts(filteredText, scope.filetypes);
         };

		$rootScope.$on('site.selection', function(event, data) {
            scope.list = [];
            if(data.available_data) {
				   data.available_data.forEach(function(item) {
                  if(item && item.downloadables && item.downloadables.length) {
                     decorateGroups(item);
                     scope.list.push(item);
                  }
               });
            }
            scope.expansions = listService.createExpansions();
            scope.update();
		});

		scope.show = function(data) {
            var bbox = toNumberArray(data.bbox);
            $rootScope.$broadcast('icsm.bbox.draw', bbox);
				console.log("show", bbox);
			};

			scope.hide = function(data) {
            $rootScope.$broadcast('icsm.bbox.draw', null);
				console.log("hide");
		};

         function decorateGroups(item) {
            var filetypeKeys = {};
            item.group = {};

            angular.forEach(scope.filetypes, function(type, key) {
               var group = decorateType(item.downloadables, type);
               if(group.length) {
                  item.group[key] = group;
               }
               filetypeKeys[type.countField] = type;
            });

            console.log(item);

            function decorateType(data, type) {
               var response = [];
               (data||[]).forEach(item => {
                  if(item[type.countField]) {
                     let obj = {};
                     type.fields.forEach(field => {
                        obj[field] = item[field];
                     });
                     response.push(obj);
                  }
               });
               return response;
            }
         }

         function decorateCounts(list, types) {
            // reset
            var checks = [];
            angular.forEach(types, function(type) {
               type.count = 0;
               checks.push(type);
            });

            if(list) {
               list.forEach(function(item) {
                  item.downloadables.forEach(function(downloadable) {
                     checks.forEach(function(check) {
                        check.count += downloadable[check.countField]?1:0;
                     });
                  });
               });
            }
         }

         function filterTypes(list, types) {
            var NAME_KEY = "index_poly_name";
            var workingList = list;
            var response = [];
            var selected = false;

            // If none are selected then we do all of them
            var keys = {};
            if(list && types) {
               angular.forEach(types, function(type) {
                  if(type.selected) {
                     selected = true;
                     type.fields.forEach(function(field) {
                        keys[field] = true;
                     });
                  }
               });
            }

            if(selected) {
               workingList = list.map(function(item) {
                  var holder, downloadables = [];
                  item.downloadables.forEach(function(download) {
                     var some = false;
                     var builder = {};
                     angular.forEach(download, function(item, key) {
                        if(keys[key]) {
                           some = true;
                           builder[key] = item;
                        }
                     });
                     if(some) {
                        builder.bbox = download.bbox;
                        builder.index_poly_name = download.index_poly_name;
                        downloadables.push(builder);
                     }
                  });

                  holder = {
                     source: item.source,
                     downloadables: downloadables
                  };
                  decorateGroups(holder);
                  return holder;
               }).filter(function(item) {
                  return item.downloadables.length > 0;
               });
            }
            return workingList;
         }

         function filterText(list, filter) {
            var NAME_KEY = "index_poly_name";
            var response = [];

            // If we have no text filter we can return now.
            if(!filter) {
               return list;
            }

            list.forEach(function(item) {
               if(item && item.downloadables && item.downloadables.length) {
                  var downloadables = [];
                  item.downloadables.forEach(function(download) {
                     var add = null;
                     angular.forEach(download, function(item, key) {
                        if(key.indexOf("name") == -1) {
                          return;
                        }
                        if((""+item).toUpperCase().search(filter.toUpperCase()) > -1) {
                           add = download;
                        }
                     });

                     if(add) {
                        downloadables.push(add);
                     }
                  });
                  if(downloadables.length) {
                     let holder = {
                        downloadables: downloadables,
                        source: item.source
                     };
                     decorateGroups(holder);
                     response.push(holder);
                  }
               }
            });
            return response;
         }

         function toNumberArray(numbs) {
            if(angular.isArray(numbs) || !numbs) {
               return numbs;
            }
            return numbs.split(/,\s*/g).map(function(numb) {
               return +numb;
            });
         }
		}
	};
}])


.factory('listService', ['$http', function($http) {
   var service = {};
   var expansions = {};

   service.createExpansions = function() {
      expansions = {};
      return expansions;
   };

   service.getMappings = function() {
      return $http.get('icsm/resources/config/list.json').then(function(response) {
         return response.data;
      });
   };

   service.getFiletypes = function() {
      return $http.get('icsm/resources/config/filetypes.json').then(function(response) {
         return response.data;
      });
   };

   return service;
}])

.filter('downloadables', function() {
   return function(available) {
      console.log(available);
      var response = [];
      if(available) {
         available.forEach(function(item) {
            if(item && item.downloadables && item.downloadables.length) {
               response.push(item);
            }
         });
      }
      return response;
   };
})

.filter('fileSize', function() {
	var meg = 1000 * 1000;
	var gig = meg * 1000;
	var ter = gig * 1000;

	return function(size) {
		if(!size) {
			return "-";
		}
        if(("" + size).indexOf(" ") > -1) {
            return size;
        }

		size = parseFloat(size);

		if(size < 1000) {
			return size + " bytes";
		}
		if(size < meg) {
			return (size / 1000).toFixed(1) + " kB";
		}
		if(size < gig) {
			return (size / meg).toFixed(1) + " MB";
		}
		if(size < ter) {
			return (size / gig).toFixed(1) + " GB";
		}
		return (size / ter).toFixed(1) + " TB";
	};
});

})(angular);