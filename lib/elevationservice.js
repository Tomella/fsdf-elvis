let request = require("request");


class ElevationService {
   constructor(template, tokenService) {
      this.template = template;
      this.tokenService = tokenService;
   }

   async get(data) {
      let workingString = this.template;
      Object.keys(data).forEach(key => {
         workingString = workingString.replace("${" + key + "}", encodeURIComponent(data[key]));
      });
      console.log("ELVIS: " + JSON.stringify(data, null, 3) + "\n\n" + workingString);

      let token = await this.tokenService.getToken();

      console.log(token);

      return new Promise(function(resolve, reject) {
         request({
            headers: {
              'Authorization': "fmetoken token=" + token
            },
            uri: workingString,
            method: 'GET'
          }, function (error, response, body) {
            resolve({error, response, body});
         });
      });
   }
}

module.exports = ElevationService;
