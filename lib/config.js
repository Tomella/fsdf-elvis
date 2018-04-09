var config = {
   sa: {
      xmlTemplate: "http://elevation.fsdf.org.au/data/gazetteer/sa/${id}.xml"
   },

   fmeToken: {
      generate: {
         tokenUrl: "http://elevation.fsdf.org.au/token", // Only used where there is no token username and password
         url: "https://gda2020test-ga.fmecloud.com/fmetoken/service/generate.json",
         username: process.env.ESRI_USERNAME,
         password: process.env.ESRI_PASSWORD
      }
   },

   validHosts: [
      "localhost",
      "qldspatial.information.qld.gov.au",
      ".ga.gov.au",
      ".motogp.com",
      "elvis-ga.fmecloud.com",
      "gda2020test-ga.fmecloud.com",
      "s3-ap-southeast-2.amazonaws.com"
   ]
};

module.exports = config;
