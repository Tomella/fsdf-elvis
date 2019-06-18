// Simply run to generate the JSON for industries from the file in lib (if updated), a list of industries
// I cut and paste the output into the config file on the industries parameter.

const industries = require("./data/industries");

console.log(JSON.stringify(industries.split("\n").map(key => ({code: key, text:key})), null, 3));