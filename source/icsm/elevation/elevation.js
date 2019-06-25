{
   angular.module("icsm.elevation.point", [])

      .factory("elevationPointsService", ['$http', '$q', 'configService',
         function ($http, $q, configService) {
            const service = {
               getElevation: function (latlng) {
                  return $q(function (resolve, reject) {
                     configService.getConfig("elevation").then(config => {
                        const delta = 0.000001;
                        let lat = latlng.lat;
                        let lng = latlng.lng;
                        let bbox = [lng - delta, lat - delta, lng + delta, lat + delta];
                        let url = config.elevationTemplate.replace("{bbox}", bbox.join(","));

                        new TerrainLoader().load(url, function (elev) {
                           resolve(elev);
                        }, function (e) {
                           reject(e);
                        });
                     });
                  });
               },

               getHiResElevation: function (latlng) {
                  return configService.getConfig("elevation").then(config =>
                        $http.get(config.hiResElevationTemplate
                                    .replace("{lng}", latlng.lng)
                                    .replace("{lat}", latlng.lat)))
               }
            };
            return service;
         }
      ]);
}