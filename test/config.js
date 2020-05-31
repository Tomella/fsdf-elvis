var config = {
    fmeToken: {
        // isDev: true,
        tokenUrl: "http://elevation-dev.fsdf.org.au/token", // Sometimes DEV will not be up so switch to prod
        region: "ap-southeast-2",
        secretName: "fsdf/apps/fmecloud_token"
    },

    secrets: {
        isDev: true,
        region: "ap-southeast-2",
        secretName: "fsdf/apps/google",
        googleKey: process.env.ELEVATION_SERVICE_KEY_VALUE,
        recaptchaPrivateKey: process.env.ELEVATION_RECAPTCHA_PRIVATE_KEY
    },
}

module.exports = config;
