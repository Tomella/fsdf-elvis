angular.module("icsm.elevation.point", [])

   .factory("elevationPointService", ['$q', 'configService',
      function ($q, configService) {
         const service = {
            getElevation: function(latlng) {
               return $q(function(resolve) {
                  configService.getConfig("elevation").then(config => {
                     const delta = 0.000001;
                     let lat = latlng.lat;
                     let lng = latlng.lng;
                     let bbox = [lng - delta, lat - delta, lng + delta, lat + delta];
                     let url = config.elevationTemplate.replace("{bbox}", bbox.join(","));

                     new TerrainLoader().load(url, function(elev) {
                        resolve(elev);
                     });
                  });
               });
            }
         };
         return service;
      }
   ]);

   class TerrainLoader {
      load(url, onload, onerror) {
          let request = new XMLHttpRequest();

          request.addEventListener( 'load', function ( event ) {
              try {
                  var parser = new GeotiffParser();
                  parser.parseHeader(event.target.response);
                  onload(parser.loadPixels());
              }
              catch(error) {
                  onerror(error);
              }
          }, false );

          if ( onerror !== undefined ) {
              request.addEventListener( 'error', function ( event ) {
                  onerror( event );
              }, false );
          }

          request.open( 'GET', url, true );
          request.responseType = 'arraybuffer';
          request.send(null);
      }
  }
