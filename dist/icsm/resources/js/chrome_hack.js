(function () {
   var isChromium = window.chrome;
   var winNav = window.navigator;
   var vendorName = winNav.vendor;
   var isOpera = typeof window.opr !== "undefined";
   var isIEedge = winNav.userAgent.indexOf("Edge") > -1;
   var isIOSChrome = winNav.userAgent.match("CriOS");

   if (isIOSChrome) {
      // is Google Chrome on IOS
   } else if (
      isChromium !== null &&
      typeof isChromium !== "undefined" &&
      vendorName === "Google Inc." &&
      isOpera === false &&
      isIEedge === false
   ) {
      // is Google Chrome
      var originalInitTile = L.GridLayer.prototype._initTile
      L.GridLayer.include({
         _initTile: function (tile) {
            originalInitTile.call(this, tile);

            var tileSize = this.getTileSize();

            tile.style.width = tileSize.x + 1 + 'px';
            tile.style.height = tileSize.y + 1 + 'px';
         }
      });
   } else {
      // not Google Chrome
   }

})()