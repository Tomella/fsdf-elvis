var config = {
   sa: {
      xmlTemplate: "http://elevation.fsdf.org.au/data/gazetteer/sa/${id}.xml"
   },

   fmeToken: {
      tokenUrl: "http://elevation.fsdf.org.au/token",
      region: "ap-southeast-2",
      secretName: "fsdf/apps/fmecloud_token"
   },

   validHosts: [
      "localhost",
      "qldspatial.information.qld.gov.au",
      ".ga.gov.au",
      ".motogp.com",
      "elvis2018-ga.fmecloud.com",
      "s3-ap-southeast-2.amazonaws.com"
   ],

   elevation: {
      nameValuePair: process.env.ELEVATION_SERVICE_KEY_VALUE,
      recaptchaPrivateKey: process.env.ELEVATION_RECAPTCHA_PRIVATE_KEY,
      useElvis: true,
      elvisTemplate: "https://elvis2018-ga.fmecloud.com/fmejobsubmitter/fsdf_elvis_prod/DEMClipZipShip_Master_S3Source.fmw?geocat_number=${id}&polygon=${polygon}&output_format=${outFormat}&out_coord_sys=${outCoordSys}&email_address=${email}&out_grid_name=${filename}&industry=${industry}&opt_showresult=false&opt_servicemode=async&opt_responseformat=json",
      postProcessingUrl: "https://elvis2018-ga.fmecloud.com/fmejobsubmitter/fsdf_elvis_prod/ZipDownloadablesPOST.fmw?opt_showresult=false&opt_servicemode=async&opt_responseformat=json"
   },
   isDev: process.env.FSDF_DEV_ENV
};

module.exports = config;
