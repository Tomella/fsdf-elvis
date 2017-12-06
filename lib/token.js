var request = require('request');

class FmeToken {
   constructor(options) {
      this.options = options;
      if(this.options.username) {
         console.log("Generating a token");
         this._refresh();
      } else {
         console.log("Proxying a token");
         this._proxy();
      }
   }

   _proxy() {
      let pUrlBase = this.options.generate.tokenUrl;

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

   _refresh() {
      if(!this.options.username) {
         return this.value;
      }

      let pUrlBase = this.options.generate.url;
      let formData = {
         user: this.options.generate.username,
         password: this.options.generate.password,
         expiration: 90,
         timeunit: "day",
         update: true
      };


console.log(JSON.stringify(formData, null, 3));


      this._pending = new Promise((resolve, reject) => {
         request.post(pUrlBase, { form: formData }, (error, response, body) => {
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

   refresh() {
      this._refresh();
      return this.value;
   }

   get value() {
      if (this._pending) {
         return this._pending;
      } else {
         return Promise.resolve(this._serviceResponse);
      }
   }
}

module.exports = FmeToken;