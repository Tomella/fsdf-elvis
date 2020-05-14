const request = require('request');
const NodeCache = require("node-cache");

class CacheService {
   constructor(config) {
      this.config = config;
      this.ttl = config.ttl? config.ttl: 3600; // 1 Hr default
      this.cache = new NodeCache({ stdTTL: this.ttl });
   }

   fetch(req, res) {
      let company = req.param("code");
      let cache = this.cache;
      let data = cache.get("asx_" + company, (err, value) => {

         let code = 500;
         if (!err) {
            if (value === undefined) {

               let url = this.config.template.replace("${code}", company);
               console.log(url);
               request.get({
                  url,
                  encoding: null
               }, function (error, response, body) {
                  if (error) {
                     console.log("Err", error);
                  }

                  if (body) {
                     console.log("storing cached value");
                     let success = cache.set( "asx_" + company, body);
                     code = response.statusCode;
                     let headers = response.headers;
                     res.header(headers);
                     res.status(code).send(body.toString());

                  } else {
                     console.log("No body!");
                     res.status(code).send('{"error":{"code": ' + code + '}}');
                  }
               });
            } else {
               console.log("fetched cached value");
               res.header({"Content-type": "application/json"});
               res.status(200).send(value);
            }
         }
      });

   }
}


module.exports = CacheService;