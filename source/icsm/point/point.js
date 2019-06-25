L.Control.ElevationControl = L.Control.extend({
   statics: {
      TITLE: 'Elevation at a point'
   },
   options: {
      position: 'topleft',
      handler: {}
   },

   toggle: function () {
      let handler = this.options.handler;
      if (this.enabled) {
         handler.disable();
         this._map._container.style.cursor = "";
         this._map.fire(L.Control.ElevationControl.Event.POINTEND, {});
         this._map.off('click', handleClick);
         this.enabled = false;

      } else {
         this._map.fire(L.Control.ElevationControl.Event.POINTSTART, {});
         this._map._container.style.cursor = "crosshair";
         handler.enable();
         this._map.on('click', handleClick);
         this.enabled = true;
      }

      function handleClick(e) {
         handler.searching(e.latlng);
      }
   },

   clear: function () {
      // Toggle does all the hard lifting so route through it
      if (this.enabled) this.toggle();
   },

   onAdd: function (map) {
      var className = 'leaflet-control-elevation';

      this._container = L.DomUtil.create('div', 'leaflet-bar');

      var link = L.DomUtil.create('a', className, this._container);
      link.href = '#';
      link.title = L.Control.ElevationControl.TITLE;

      L.DomEvent
         .addListener(link, 'click', L.DomEvent.stopPropagation)
         .addListener(link, 'click', L.DomEvent.preventDefault)
         .addListener(link, 'click', this.toggle, this);

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
      .directive("pointElevation", ["elevationPointsService", "mapService", function (elevationPointsService, mapService) {
         return {
            restrict: "AE",
            templateUrl: "icsm/point/point.html",
            link: function (scope) {

               scope.close = function () {
                  scope.control.clear();
                  scope.enabled = false;
                  scope.elevation = scope.latitude = scope.longitude = null;
               }

               mapService.getMap().then(map => {
                  scope.control = L.Control.elevationControl({ handler }).addTo(map);
                  console.log("Point signing in");
               });

               var handler = {
                  disable: function () {
                     scope.enabled = false;
                     scope.error = scope.elevation = scope.latitude = scope.longitude = null;
                     console.log("Disable elevation handler here")
                  },

                  enable: function (map) {
                     scope.$apply(() => {
                        scope.enabled = true;
                        scope.error = scope.elevation = scope.latitude = scope.longitude = null;
                        console.log("Enable elevation handler here");
                     });
                  },

                  enabled: function () {
                     return scope.enabled;
                  },

                  searching: function (latlng) {
                     scope.latitude = latlng.lat;
                     scope.longitude = latlng.lng;
                     scope.elevation = scope.error = null;
                     elevationPointsService.getElevation(latlng).then(elevation => {
                        scope.elevation = +elevation[0];
                     }).catch(e => {
                        scope.error = "No data available at this point";
                     })

                  },

                  searched: function (elevation) {
                     scope.elevation = elevation;
                  }
               }
            }
         }
      }]);
}