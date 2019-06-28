L.Control.ElevationControl = L.Control.extend({
   statics: {
      TITLE: 'Elevation at a point',
      ALT_TITLE: 'Disable elevation at a point',
      CLASS_NAME: "leaflet-control-elevation"
   },
   options: {
      position: 'topleft',
      handler: {}
   },

   toggle: function () {
      let handler = this.options.handler;
      let handleClick = this.handleClick;

      if (handler.enabled()) {
         this._map._container.style.cursor = "";
         this._map.fire(L.Control.ElevationControl.Event.POINTEND, {});
         this._map.off('click', handleClick);
         this.link.title = L.Control.ElevationControl.TITLE;
         handler.disable();
      } else {
         this._map.fire(L.Control.ElevationControl.Event.POINTSTART, {});
         this._map._container.style.cursor = "crosshair";
         this._map.on('click', handleClick);
         this.link.title = L.Control.ElevationControl.ALT_TITLE;
         handler.enable();
      }
   },

   onAdd: function (map) {
      var className = L.Control.ElevationControl.CLASS_NAME;

      this._container = L.DomUtil.create('div', 'leaflet-bar');

      var link = this.link = L.DomUtil.create('a', className, this._container);
      link.href = '#';
      link.title = L.Control.ElevationControl.TITLE;

      L.DomEvent
         .addListener(link, 'click', L.DomEvent.stopPropagation)
         .addListener(link, 'click', L.DomEvent.preventDefault)
         .addListener(link, 'click', this.toggle, this);

      map.on("draw:drawstart", () => {
         this.clear();
      });

      this.handleClick = function handleClick(me) {
         return function(e) {
            me.searching(e.latlng);
         }
      }(this.options.handler);

      return this._container;
   }
});

L.Map.mergeOptions({
   elevationControl: false
});

L.Control.elevationControl = function (options) {
   return new L.Control.ElevationControl(options);
};

L.Control.ElevationControl.Event = {
   POINTSTART: "point:start",
   POINTEND: "point:end"
};

{
   angular.module("icsm.point", [])
      .directive("pointElevation", ["elevationPointsService", "flashService", "mapService",
                  function (elevationPointsService, flashService, mapService) {
         return {
            restrict: "AE",
            link: function (scope) {
               var flasher = null;

               mapService.getMap().then(map => {
                  scope.map = map;
                  scope.control = L.Control.elevationControl({ handler }).addTo(map);
                  console.log("Point signing in");
               });

               var handler = {
                  disable: function () {
                     scope.enabled = false;
                     console.log("Disable elevation handler here")
                     flashService.remove(flasher);
                     map.closePopup();
                     flasher = flashService.add("Click map for datasets surrounding a point.", 10000);
                  },

                  enable: function (map) {
                     scope.enabled = true;
                     scope.$apply(() => {
                        flashService.remove(flasher);
                        flasher = flashService.add("Click map for detailed elevation information at point", 10000);
                     });
                  },

                  enabled: function () {
                     return scope.enabled;
                  },

                  searching: function (latlng) {
                     flashService.remove(flasher);
                     scope.elevation = scope.error = null;
                     flasher = flashService.add("Retrieving elevation data", 20000, true);
                     elevationPointsService.getHiResElevation(latlng).then(response => {
                        let data = response.data;
                        let map = scope.map;
                        flashService.remove(flasher);
                        /*
                           "SOURCE": "Geoscience Australia",
                           "DATASET": "SRTM-derived 1 Second Digital Elevation Models Version 1.0",
                           "DEM RESOLUTION": "30m",
                           "HEIGHT AT LOCATION": "524.67m",
                           “METADATA_URL”: “https://ecat.ga.gov.au/geonetwork/srv/eng/catalog.search#/metadata/22be4b55-2465-4320-e053-10a3070a5236”
                        */
                        let elevation = data["HEIGHT AT LOCATION"];
                        let buffer = [];
                        let lat = latlng.lat.toFixed(5) + "&deg;";
                        let lng = latlng.lng.toFixed(5) + "&deg;";
                        if(elevation === "m" || elevation === undefined || elevation === "No data") {
                           buffer.push(title("Lat/Lng") + lat + "/" + lng);
                           buffer.push("<strong>No data available at this point</strong>");
                        } else {
                           buffer.push(title("Elevation") + elevation);
                           buffer.push(title("Lat/Lng") + lat + "/" + lng);
                           buffer.push(title("Source") + data.SOURCE);
                           buffer.push(title("Dataset") + "<span class='elevation-popup ellipsis' title='" +
                                 data.DATASET + "'>" +  metadataLink(data.DATASET, data["METADATA URL"]) + "</span>");
                           buffer.push(title("DEM Resolution") + data["DEM RESOLUTION"]);
                        }
                        L.popup({maxWidth:400})
                           .setLatLng(latlng)
                           .setContent("<div class='fi-popup'>" + buffer.join("<br/>") + "</div>")
                           .openOn(map);
                        scope.elevation = data;

                     }).catch(e => {
                        flashService.remove(flasher);
                        scope.error = "No data available at this point";
                     });

                     function title(text) {
                        return "<strong>" + text + ":</strong> "
                     }

                     function metadataLink(text, link) {
                        if(!link) return text;

                        return "<a href='" + link + "' target='_blank'>" + text + "</a>";
                     }

                  }
               }
            }
         }
      }]);
}