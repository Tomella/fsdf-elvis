(function (angular, L) {
   'use strict';

   angular.module("common.featureinfo", [])

      .directive("commonFeatureInfo", ['$http', '$log', function ($http, $log) {
         return {
            require: "^geoMap",
            restrict: "AE",
            link: function (scope, element, attrs, ctrl) {
               if (typeof scope.options === "undefined") {
                  scope.options = {};
               }

               ctrl.getMap().then(function (map) {
                  map.on("click", clicked);

                  var url = "https://elvis20161a-ga.fmecloud.com/fmedatastreaming/elvis_indexes/GetFeatureInfo_GA5mDEM.fmw?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&SRS=EPSG%3A4326&BBOX=152.73734400000001%2C-27.930875631314006%2C152.99586285714287%2C-27.656022654400271&WIDTH=823&HEIGHT=875&LAYERS=public.5dem_ProjectsIndex&STYLES=&QUERY_LAYERS=public.5dem_ProjectsIndex&INFO_FORMAT=application%2Fjson&FEATURE_COUNT=100&X=700&Y=500";
                  function clicked(event) {
                     $http.get(url).then(function (data) {
                        console.log(event);
                        console.log(data);
                        scope.data = data;
                     });
                  }
               });
            }
         };
      }]);

})(angular, L);
