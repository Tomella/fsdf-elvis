
process.env.NO_PROXY = "localhost";

var config = require("./lib/config");
var express = require("express");

var bodyParser = require('body-parser');

var request = require('request');
request.gzip = false;

var dontProxyHeaderRegex = /^(?:Host|Proxy-Connection|Accept-Encoding|Connection|Keep-Alive|Transfer-Encoding|TE|Trailer|Proxy-Authorization|Proxy-Authenticate|Upgrade)$/i;
// There should only ever be a couple. We do a contains on the requested host.
var validHosts = config.validHosts;

var app = express();

app.use(function(req, res, next) {
   // service uses pipes and body parser reads the stream and closes it.
   if(req.url.indexOf("/service/") === 0) {
       return next();
   } else {
       bodyParser.json({limit: '30mb'})(req,res,next);
   }
});


var url = require('url');
var X2JS = require('x2js');

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

// There should only ever be a couple. We do a contains on the requested host.
var validHosts = config.validHosts;
var upstreamProxy = argv['upstream-proxy'];

app.get('/xml2js/*', function (req, res, next) {
    // look for request like http://localhost:8080/proxy/http://example.com/file?query=1
    var remoteUrl = getRemoteUrlFromParam(req);
    if (!remoteUrl) {
        // look for request like http://localhost:8080/proxy/?http%3A%2F%2Fexample.com%2Ffile%3Fquery%3D1
        remoteUrl = Object.keys(req.query)[0];
        if (remoteUrl) {
            remoteUrl = url.parse(remoteUrl);
        }
    }

    if (!remoteUrl) {
        return res.status(400).send('No url specified.');
    }

    // We only want a very few requests to get through. Via the whitelist.
    var host = remoteUrl.host;
    if (!validHosts.some((valid) => {
        return host.indexOf(valid) > -1;
    })) {
        return res.status(403).send('Not a white listed host. Go away!');
    }

    if (!remoteUrl.protocol) {
        remoteUrl.protocol = 'http:';
    }

    var proxy;
    if (upstreamProxy && !(remoteUrl.host in bypassUpstreamProxyHosts)) {
        proxy = upstreamProxy;
    }

    // encoding : null means "body" passed to the callback will be raw bytes

    request.get({
        url: url.format(remoteUrl),
        headers: filterHeaders(req, req.headers),
        encoding: null,
        proxy: proxy
    }, function (error, response, body) {
        var code = 500;
        var x2js, text, headers, decoder = new StringDecoder('utf8');
        if(error) {
            console.log("Err", error);
        }
        if (body) {
            code = response.statusCode;
            headers = filterHeaders(req, response.headers);
            headers['Content-Type'] = 'application/json';
            res.header(headers);
            text = body.toString();
            x2js = new X2JS();
            res.status(code).send(x2js.xml2js(body.toString()));
        } else {
            console.log("No body!")
            res.status(code).send('{"error":{"code": ' + code + '}}');
        }
    });
});

app.get('/proxy/*', function (req, res, next) {
    // look for request like http://localhost:8080/proxy/http://example.com/file?query=1

    var remoteUrl = getRemoteUrlFromParam(req);
    if (!remoteUrl) {
        // look for request like http://localhost:8080/proxy/?http%3A%2F%2Fexample.com%2Ffile%3Fquery%3D1
        remoteUrl = Object.keys(req.query)[0];
        if (remoteUrl) {
            remoteUrl = url.parse(remoteUrl);
        }
    }

    if (!remoteUrl) {
        return res.status(400).send('No url specified.');
    }

    // We only want a very few requests to get through. Via the whitelist.
    var host = remoteUrl.host;
    if (!validHosts.some((valid) => {
        return host && host.indexOf(valid) > -1;
    })) {
        return res.status(403).send('Not a white listed host. Go away!');
    }

    if (!remoteUrl.protocol) {
        remoteUrl.protocol = 'http:';
    }

    var proxy;
    if (upstreamProxy && !(remoteUrl.host in bypassUpstreamProxyHosts)) {
        proxy = upstreamProxy;
    }

    // encoding : null means "body" passed to the callback will be raw bytes

    request.get({
        url: url.format(remoteUrl),
        headers: filterHeaders(req, req.headers),
        encoding: null,
        proxy: proxy
    }, function (error, response, body) {
        var code = 500;

        if (response) {
            code = response.statusCode;
            res.header(filterHeaders(req, response.headers));
        }

        res.status(code).send(body);
    });
});

app.listen(port, function (err) {
    console.log("running server on port " + port);
});


function getRemoteUrlFromParam(req) {
   var remoteUrl = req.params[0];
   if (remoteUrl) {
       // add http:// to the URL if no protocol is present
       if (!/^https?:\/\//.test(remoteUrl)) {
           // Now double slashes are removed on some URL's by some servers (which is the right behaviour)
           if (!/^https?:\//.test(remoteUrl)) {
              remoteUrl = 'http://' + remoteUrl;
           } else {
              remoteUrl = remoteUrl.replace(":/", "://");
           }
       }
       remoteUrl = url.parse(remoteUrl);
       // copy query string
       remoteUrl.search = url.parse(req.url).search;
   }
   return remoteUrl;
}

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