const SecretsManager = require('./secretsmanager');
const request = require("request");

class FmeToken {
   constructor(options) {
      this.options = options;
      if(!options.isDev) {
         if(!options.region || !options.secretName) {
            throw new Error("Need both region and secretName in options");
         }
         this.manager = new SecretsManager(this.options.region);
      } else {
         if(!options.tokenUrl) {
            throw new Error("If you are going to proxy the token a URL to fetch the token must be provided");
         }
      }
   }

   _proxy() {
      let pUrlBase = this.options.tokenUrl;
      return new Promise((resolve, reject) => {
         request.get(pUrlBase, (error, response, body) => {
            if (error) {
               console.log("Couldn't load FME token");
               reject(error);
            } else if (!response || response.statusCode !== 200) {
               console.log("Response status = " + response.statusCode);
               reject("Strange status code getting token: " + JSON.stringify(response, null, 3));
            } else {
               // 20200527 - We need backward compatability. We can take this test out after next release knowing it will be a token only.
               if(body.indexOf("serviceResponse")) {                  
                  resolve(JSON.parse(body).serviceResponse.token);
               } else {
                  // Its just the token string
                  resolve(body);
               }
            }
         });
      });
   }

   async getToken() {
      if(this.options.isDev) {
         return this._proxy();
      }
      let packet = await this.manager.getSecretValue(this.options.secretName);
      return JSON.parse(packet).FME_TOKEN;
   }
}

module.exports = FmeToken;