/*!
 * Copyright 2016 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function (angular) {

    'use strict';

    angular.module("elvis.results", [])

        .directive('icsmList', ['$rootScope', 'listService', function ($rootScope, listService) {
            return {
                templateUrl: 'icsm/list/list.html',
                link: function (scope) {
                    listService.getMappings().then(function (response) {
                        scope.mappings = response;
                    });

                    listService.getFiletypes().then(function (response) {
                        scope.filetypes = response;
                    });
                    scope.filter = "";

                    scope.matched = function () {
                        var count = 0;
                        if (scope.list) {
                            scope.list.forEach(function (item) {
                                if (item.downloadables) {
                                    angular.forEach(item.downloadables, (group) => {
                                        count += group.length;
                                    });
                                }
                            });
                        }
                        return count;
                    };

                    scope.fullCount = function (name) {
                        var count = 0;
                        scope.list.forEach(function (available) {
                            var count = 0;
                            if (available.source == name) {
                                angular.forEach(item.downloadables, (group) => {
                                    count += group.length;
                                });
                            }
                        });
                        return count;
                    };

                    scope.update = function () {
                        var filteredText = filterText(scope.list, scope.filter);
                        scope.filteredList = filterTypes(filteredText, scope.filetypes);
                        scope.typeCounts = decorateCounts(filteredText, scope.filetypes);
                    };

                    $rootScope.$on('site.selection', function (event, data) {
                        scope.list = [];
                        if (data.available_data) {
                            scope.list = data.available_data;
                        }
                        scope.expansions = listService.createExpansions();
                        scope.update();
                    });

                    scope.show = function (data) {
                        var bbox = toNumberArray(data.bbox);
                        $rootScope.$broadcast('icsm.bbox.draw', bbox);
                        console.log("show", bbox);
                    };

                    scope.hide = function (data) {
                        $rootScope.$broadcast('icsm.bbox.draw', null);
                        console.log("hide");
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

                    function filterText(list, filter) {
                        var NAME_KEY = "index_poly_name";
                        var response = [];

                        // If we have no text filter we can return now.
                        if (!filter) {
                            return list;
                        }

                        list.forEach(function (item) {
                            if (item && item.downloadables && item.downloadables.length) {
                                var downloadables = [];
                                item.downloadables.forEach(function (download) {
                                    var add = null;
                                    angular.forEach(download, function (item, key) {
                                        if (key.indexOf("name") == -1) {
                                            return;
                                        }
                                        if (("" + item).toUpperCase().search(filter.toUpperCase()) > -1) {
                                            add = download;
                                        }
                                    });

                                    if (add) {
                                        downloadables.push(add);
                                    }
                                });
                                if (downloadables.length) {
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


        .factory('listService', ['$http', function ($http) {
            var service = {};
            var expansions = {};

            service.createExpansions = function () {
                expansions = {};
                return expansions;
            };

            service.getMappings = function () {
                return $http.get('icsm/resources/config/list.json').then(function (response) {
                    return response.data;
                });
            };

            service.getFiletypes = function () {
                return $http.get('icsm/resources/config/filetypes.json').then(function (response) {
                    return response.data;
                });
            };

            return service;
        }])

        .filter('downloadables', function () {
            return function (available) {
                console.log(available);
                var response = [];
                if (available) {
                    available.forEach(function (item) {
                        if (item && item.downloadables && item.downloadables.length) {
                            response.push(item);
                        }
                    });
                }
                return response;
            };
        })

        .filter('fileSize', function () {
            var meg = 1000 * 1000;
            var gig = meg * 1000;
            var ter = gig * 1000;

            return function (size) {
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
            };
        });

})(angular);