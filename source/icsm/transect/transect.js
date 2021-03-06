{
   angular.module("icsm.transect", [])

      .provider("transectService", function () {
         var diagonal = 500,
            layers = {},
            ptElevationUrl,
            extent = {
               lngMin: 112.99986111100009,
               lngMax: 153.999861113351,
               latMin: -44.0001389004617,
               latMax: -10.00013890099995
            };

         this.extent = function (newExtent) {
            extent.lngMin = angular.isUndefined(newExtent.lngMin) ? extent.lngMin : newExtent.lngMin;
            extent.lngMax = angular.isUndefined(newExtent.lngMax) ? extent.lngMax : newExtent.lngMax;
            extent.latMin = angular.isUndefined(newExtent.latMin) ? extent.latMin : newExtent.latMin;
            extent.latMax = angular.isUndefined(newExtent.latMax) ? extent.latMax : newExtent.latMax;
         };

         this.setServiceUrl = function (name, url) {
            name = name.toLowerCase();
            layers[name] = {
               urlTemplate: url
            };
            if (name === "elevation") ptElevationUrl = url.replace(/{height}|{width}/g, "1");
         };

         function calcSides(diagonal, ar) {
            // x * x + ar * ar * x * x = diagonal * diagonal
            // (1 + ar * ar) * x * x = diagonal * diagonal
            // x * x = diagonal * diagonal / (1 + ar * ar)
            var y = Math.sqrt(diagonal * diagonal / (1 + ar * ar));
            return { y: Math.ceil(y), x: Math.ceil(y * ar) };
         }

         this.$get = ['$q', function ($q) {

            return {
               getElevation: function (geometry, buffer) {
                  return this.getServiceData("elevation", geometry, buffer);
               },

               getServiceData: function (name, geometry, buffer) {
                  var feature = Exp.Util.toGeoJSONFeature(geometry),
                     bbox = turf.extent(feature),
                     response = {
                        type: "FeatureCollection",
                        features: []
                     },
                     lngMin = bbox[0],
                     latMin = bbox[1],
                     lngMax = bbox[2],
                     latMax = bbox[3];

                  // Sanity check for service url
                  name = name.toLowerCase();
                  var svcUrl = layers[name] && layers[name].urlTemplate;
                  if (!svcUrl) return $q.when(response);

                  // Sanity check for coordinates
                  lngMax = lngMax > lngMin ? lngMax : lngMin + 0.0001;
                  latMax = latMax > latMin ? latMax : latMin + 0.0001;
                  var dx = lngMax - lngMin, dy = latMax - latMin;
                  if (!buffer) buffer = 0;
                  latMin = latMin - (buffer * dy);
                  latMax = latMax + (buffer * dy);
                  lngMin = lngMin - (buffer * dx);
                  lngMax = lngMax + (buffer * dx);

                  var xy = calcSides(diagonal, dx / dy),
                     kiloms = turf.lineDistance(feature, "kilometers"),
                     terrainLoader = new TerrainLoader(),
                     deferred = $q.defer();
                  svcUrl = svcUrl.replace("{bbox}", lngMin + "," + latMin + "," + lngMax + "," + latMax)
                     .replace(/{width}/g, "" + Math.ceil(xy.x)).replace(/{height}/g, "" + Math.ceil(xy.y));
                  terrainLoader.load(svcUrl, function (loaded) {
                     //                            console.log("width: " + xy.x + ", height: " + xy.y + "calculated cells = " + (xy.x * xy.y) + " loaded length = " + loaded.length);

                     var delta = kiloms / (diagonal - 1);
                     for (var i = 0; i < diagonal; i++) {
                        var distance = i * delta;
                        var deltaFeature = turf.along(feature, distance, "kilometers"),
                           height = toHeight(deltaFeature.geometry.coordinates);

                        deltaFeature.properties.distance = distance;
                        ;
                        if (height > -32767) {
                           deltaFeature.geometry.coordinates.push(height);
                           response.features.push(deltaFeature);
                        }
                     }
                     deferred.resolve(response);

                     function toHeight(coord) {
                        var x = coord[0], y = coord[1], zeroX = lngMin, zeroY = latMax,
                           cellY = Math.round((zeroY - y) / dy * (xy.y - 1)),
                           cellX = Math.round((x - zeroX) / dx * (xy.x - 1)),
                           index = cellY * xy.x + cellX;
                        // console.log("Cell x = " + cellX + ", y = " + cellY + " Index = " + index + ", value = " + loaded[index]);
                        return loaded[index];
                     }
                  }, function (error) {
                     console.log("Failed to load transect data for " + name);
                     deferred.reject(error);
                  });

                  return deferred.promise;
               },

               isServiceDataAvailable: function (name) {
                  return layers[name] && layers[name].urlTemplate;
               },

               getElevationAtPoint: function (latlng) {
                  var lng = latlng.lng, lat = latlng.lat;
                  if (lat < extent.latMin || lat > extent.latMax || lng < extent.lngMin || lng > extent.lngMax)
                     return $q.when(null);

                  var bbox = [
                     lng - 0.000001,
                     lat - 0.000001,
                     lng + 0.000001,
                     lat + 0.000001
                  ];
                  var deferred = $q.defer();
                  new TerrainLoader().load(ptElevationUrl.replace("{bbox}", bbox.join(",")), function (elev) {
                     deferred.resolve(elev);
                  }, function(error) {
                     console.log("Error, probably out of bounds");
                  });
                  return deferred.promise;
               }
            };

         }];
      });

}