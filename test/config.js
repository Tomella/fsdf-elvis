var config = {
    fmeToken: {
       // isDev: true,
       tokenUrl: "http://elevation-dev.fsdf.org.au/token", // Sometimes DEV will not be up so switch to prod
       region: "ap-southeast-2",
       secretName: "fsdf/apps/fmecloud_token"
    }
}

module.exports = config;