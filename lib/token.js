const SecretsManager = require('./secretsmanager');
const request = require("request");

class Token {
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
         console.log(this.options);
         this.promise = this._proxy();
      }
   }

   _proxy() {
      let pUrlBase = this.options.tokenUrl;
      return new Promise((resolve, reject) => {
         request.get(pUrlBase, (error, response, body) => {
            if (error) {
               reject(error);
            } else if (!response || response.statusCode !== 200) {
               reject("Strange status code getting token: " + JSON.stringify(response, null, 3));
            } else {
               if(body.indexOf("serviceResponse") == -1) {
                  resolve(body);
               } else {
                  resolve(JSON.parse(body).serviceResponse.token);
               } 
            }
         });
      });
   }

   async getToken() {
      if(this.options.isDev) {
         return this.promise;
      }
      let packet = await this.manager.getSecretValue(this.options.secretName);
      return JSON.parse(packet).FME_TOKEN;
   }
}

module.exports = Token;