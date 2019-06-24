{
   angular.module("icsm.elevation.point", [])

      .factory("elevationPointService", ['$q', 'configService',
         function ($q, configService) {
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
               }
            };
            return service;
         }
      ]);
}