var SecretsManager = require('./secretsmanager');

class FmeToken {
   constructor(options) {
      this.options = options;
      if(this.options.isDev) {
         console.log("Proxying a token");
         this._proxy();
      } else {
         this._refresh();
      }
   }

   async _proxy() {
      let pUrlBase = this.options.tokenUrl;

      this._pending = new Promise((resolve, reject) => {
         request.get(pUrlBase, (error, response, body) => {
            if (error) {
               console.log("Couldn't load FME token");
               reject(error);
            } else if (!response || response.statusCode !== 200) {
               console.log("Response status = " + response.statusCode);
               reject("Strange status code getting token: " + JSON.stringify(response, null, 3));
            } else {
               this._serviceResponse = body;
               resolve(this._serviceResponse);
               console.log(body);
            }
            this._pending = null;
         });
      });
   }

   async _refresh() {
      this._pending = await new SecretsManager(this.options.secretName).getSecretValue(this.options.secretName);
   }

   async refresh() {
      if(this.options.isDev) {
         console.log("Proxying a token");
         this._proxy();
      } else {
         this._refresh();
      }
      return this._pending;
   }

   async getToken() {
      return this._pending;
   }
}

module.exports = FmeToken;