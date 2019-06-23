// In the style of threejs loaders. Adapted from here
// https://github.com/Tomella/elevation/blob/master/source/geotiff/terrainloader.ts
class TerrainLoader {
   load(url, onload, onerror) {
      let request = new XMLHttpRequest();

      request.addEventListener('load', function (event) {
         try {
            var parser = new GeotiffParser();
            parser.parseHeader(event.target.response);
            onload(parser.loadPixels());
         } catch (error) {
            console.log("nooooooooooooooooooooooooooooooooooooooooo")
            onerror(error);
         }
      }, false);

      if (onerror !== undefined) {
         request.addEventListener('error', function (event) {
            onerror(event);
         }, false);
      }

      request.open('GET', url, true);
      request.responseType = 'arraybuffer';
      request.send(null);
   }
}