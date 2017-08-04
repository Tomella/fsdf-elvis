const config = require("./config");
const SaMapper = require("./sa-mapper");

const saMapper = new SaMapper(config.sa);

let mappers = {
   findById: function (id) {
      console.log(id)
      if (id.toLowerCase().indexOf("sa") === 0) {
         return saMapper;
      }
      return null;
   }
};

module.exports = mappers;