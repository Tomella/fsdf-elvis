{
   angular.module("water.regions", [])

      .directive("waterRegions", ["$http", "configService", "mapService", function ($http, configService, mapService) {
         return {
            link: function (scope) {
               let layer;
               mapService.getMap().then((map) => {
                  scope.map = map;
                  configService.getConfig("regions").then(config => {
                     $http.get(config.regionsUrl).then((response) => {
                        let features = response.data.features;
                        let divisionsMap = {};
                        features.forEach(feature => {
                           let name = feature.properties.Division;
                           divisionsMap[name] =  divisionsMap[name] || [];
                           divisionsMap[name].push(feature);
                        });

                        let divisions = [];
                        Object.keys(divisionsMap).forEach((key, index) => {
                           let features = divisionsMap[key];
                           let color = config.divisionColors[index % config.divisionColors.length];
                           let division = L.geoJson(features, {
                              onEachFeature: (feature, layer) => {
                                 layer.on("mouseover", () => {
                                    console.log("river", layer);
                                 });
                              },
                              style: function (feature) {
                                 return {
                                    color: "black",
                                    fillOpacity: 0.2,
                                    fillColor: color,
                                    weight: 1
                                 };
                              }
                           });

                           let divisionOptions = config.divisionOptions[key] || {
                              center: division.getBounds().getCenter()
                           };

                           var marker = new L.marker(divisionOptions.center, { opacity: 0.01 });
                           marker.bindLabel(key, {noHide: true, className: "regions-label", offset: [0, 0]});
                           marker.addTo(map);

                           divisions.push(division);
                        });

                        let featureGroup = L.featureGroup(divisions, {
                           style: function (feature) {
                              return {
                                 color: "black",
                                 fill: true,
                                 fillColor:"red",
                                 weight: 1
                              };
                           }
                        }).on("mouseover", (group) => {
                           console.log("division", group);
                        }).addTo(map);

                     });
                  });
               });
            }
         };
      }])
}