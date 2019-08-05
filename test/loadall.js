const request = require('request');
const TEMPLATE = "https://elvis2018-ga.fmecloud.com/fmedatastreaming/elvis_test/ReturnDownloadables.fmw?polygon=POLYGON(({minx}%20{miny}%2C{minx}%20{maxy}%2C{maxx}%20{maxy}%2C{maxx}%20{miny}%2C{minx}%20{miny}))";
let coords = {minx:88, miny:-60, maxx:178, maxy: -8};

async function main(con) {
   let url = TEMPLATE.replace(/\{maxx}/g, coords.maxx)
   .replace(/\{maxy\}/g, coords.maxy)
   .replace(/\{minx}/g, coords.minx)
   .replace(/\{miny}/g, coords.miny);
console.log(url)

   async function getIt(coords) {
      request.post({
         url: config.sessionPostUrl,
         headers: headers,
         body: {
            identifier: config.username,
            password: config.password
         },
         json: true
      }, (error, results, data) => {
         if (error) {
            this.lastError = error;
         } else {

         }
         console.log(data, results.headers);
      });
   }
}

main().then(() => {
   console.log("finit");
});

function coordsToUrl({minx, miny, maxx, maxy}) {
   return TEMPLATE.replace(/\{maxx}/g, maxx)
         .replace(/\{maxy\}/g, maxy)
         .replace(/\{minx}/g, minx)
         .replace(/\{miny}/g, miny);
}