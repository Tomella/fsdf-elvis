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
         this._map.off('click', handleClick);
         this.enabled = false;
      } else {
         handler.enable();
         this._map.on('click', handleClick);
         this.enabled = true;
      }

      function handleClick(e) {
         handler.searching(e.latlng);
         e.originalEvent.stopPropagation();
         e.originalEvent.preventDefault();
         return false;
      }
   },

   clear: function () {
      if (this.enabled) this.toggle();
   },

   onAdd: function (map) {
      var className = 'leaflet-control-elevation';
      console.log(this)

      if (!L.Browser.touch || L.Browser.ie) {
         L.DomEvent.disableClickPropagation(element);
         L.DomEvent.on(this._map._container, 'mousewheel', L.DomEvent.stopPropagation);
      } else {
         L.DomEvent.on(this._map._container, 'click', L.DomEvent.stopPropagation);
      }

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

{
   angular.module("icsm.point", [])
      .directive("pointElevation", ["elevationPointService",  "mapService", function (elevationPointService, mapService) {
         return {
            restrict: "AE",
            templateUrl: "icsm/point/point.html",
            link: function (scope) {

               scope.close = function () {
                  scope.control.clear();
                  scope.enabled = false;
                  scope.elevation = scope.latitude = scope.longitude = null;
               }

               scope.elevation = 45.6666667234;
               scope.latitude = -38.34425882254;
               scope.longitude = 148.2342115;
               mapService.getMap().then(map => {
                  scope.control = L.Control.elevationControl({ handler }).addTo(map);
                  console.log("Point signing in");
               });

               var handler = {
                  disable: function () {
                     scope.enabled = false;
                     scope.elevation = scope.latitude = scope.longitude = null;
                     console.log("Disable elevation handler here")
                  },

                  enable: function (map) {
                     scope.enabled = true;
                     scope.elevation = scope.latitude = scope.longitude = null;
                     console.log("Enable elevation handler here");

                  },

                  enabled: function () {
                     return scope.enabled;
                  },

                  searching: function (latlng) {
                     scope.latitude = latlng.lat;
                     scope.longitude = latlng.lng;
                     scope.elevation = null;
                     elevationPointService.getElevation(latlng).then(elevation => {
                        scope.elevation = elevation[0];
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