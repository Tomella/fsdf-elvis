let config = {
   referers: {
      localhost: true,
      "elevation.geospeedster.com": true,
      "elevation.fsdf.org.au": true
   },
   services: {

   }
};
var express = require("express");
var CacheService = require("./lib/cache");
var cacheService = new CacheService(config);

var request = require('request');
request.gzip = false;

var app = express();

var StringDecoder = require('string_decoder').StringDecoder;
var yargs = require('yargs').options({
    'port': {
        'default': 5000,
        'description': 'Port to listen on.'
    },
    'public': {
        'type': 'boolean',
        'description': 'Run a public server that listens on all interfaces.'
    },
    'upstream-proxy': {
        'description': 'A standard proxy server that will be used to retrieve data.  Specify a URL including port, e.g. "http://proxy:8000".'
    },
    'bypass-upstream-proxy-hosts': {
        'description': 'A comma separated list of hosts that will bypass the specified upstream_proxy, e.g. "lanhost1,lanhost2"'
    },
    'help': {
        'alias': 'h',
        'type': 'boolean',
        'description': 'Show this help.'
    }
});
var argv = yargs.argv;
var port = process.env.PORT || argv.port;

app.get('/wms/*', function (req, res, next) {
   console.log(req.headers.referer);
   res.send("OK");
   // return cacheService.fetch(req, res);
});

app.listen(port, function (err) {
    console.log("running server on port " + port);
});

function filterHeaders(req, headers) {
   var result = {};
   // filter out headers that are listed in the regex above
   Object.keys(headers).forEach(function (name) {
       if (!dontProxyHeaderRegex.test(name)) {
           result[name] = headers[name];
       }
   });
   return result;
}