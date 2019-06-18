// To generate a file just pipe the output to a file
// The file used by the app is sourced from the config file so add the output there.


const industries = require("./data/industries");

console.log(JSON.stringify(industries.split("\n").map(key => ({code: key, text:key})), null, 3));