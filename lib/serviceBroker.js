let request = require("request");

let ElvisService = require("./elvisService");
let FsdfService = require("./fsdfService");
let NameValuePair = require("./nameValuePair");


class ServiceBroker {
   constructor(config) {
      this.config = config;
      this.elvisService = new ElvisService(config.elvisTemplate + "&" + config.nameValuePair);
      this.fsdfService = new FsdfService(config.postProcessingUrl);
      this.nameValuePair = new NameValuePair(config.nameValuePair);
   }

   execute(data) {
      let availableData = data.available_data;
      let parameters = data.parameters;
      let clip = {
         xMax: parameters.xmax,
         xMin: parameters.xmin,
         yMax: parameters.ymax,
         yMin: parameters.ymin
      };
      let response = new Promise((resolve, reject) => {
         let promises = [];

         if(this.config.useElvis) {
            let flat = flatten(availableData);
            flat.filter(product => product.product).forEach(product => {
               var postData = Object.assign({}, clip, {
                  id: product.metadata_id,
                  filename: "",
                  outFormat: parameters.outFormat,
                  outCoordSys: parameters.outCoordSys,
                  email: parameters.email
               });
               promises.push(this.elvisService.execute(postData))
            });

            let filteredData = convertFlatToStructured(flat.filter(data => !data.product));
            filteredData.parameters = Object.assign({}, data.parameters);
            filteredData.parameters[this.nameValuePair.name] = this.nameValuePair.value;

            if(filteredData.available_data && filteredData.available_data.length) {
               //console.log(JSON.stringify(filteredData, null, 3));
               promises.push(this.fsdfService.execute(filteredData));
            }
         } else {
            promises.push(this.fsdfService.execute(data));
         }

         Promise.all(promises).then(results => {
            // console.log("ServiceBroker: " + results.length);
            // console.log(JSON.stringify(results, null, 2));
            if(results.length === 1) {
               resolve(results[0]);
            } else {
               // Check any that errored
               let errorCount = results.filter(result => result.status === 'error').length;
               if(errorCount) {
                  resolve({
                     status: "error",
                     message: errorCount + " of " + results.length + " jobs failed."
                  });
               } else {
                  resolve({
                     status: "success",
                     message: "Your request has been submitted. You will receive " + results.length + " email(s) with the results soon."
                  });
               }
            }
         }).catch((result) => {
            resolve({
               status: "error",
               message: "There has been an unspecified error. Please try again later."
            })
         });
      });
      return response;
   }
}

var fields = ["file_url", "file_name", "project_name", "product", "metadata_id", "file_size", "bbox"];

function flatten(data) {
   var flat = [];

   data.forEach(owner => {
      let source = owner.source;
      let keys = Object.keys(owner.downloadables);
      keys.forEach(typeKey => {
         let type = owner.downloadables[typeKey];
         let keys = Object.keys(type);
         keys.forEach(groupKey => {
            let group = type[groupKey];

            group.forEach(dataset => {
               let mapped = Object.assign(
                  {
                     group: groupKey,
                     type: typeKey,
                     source: source
                  },
                  dataset
               );
               flat.push(mapped);
            })
         })
      })
   })
   return flat;
}

function convertFlatToStructured(flat) { // ["index_poly_name", "file_name", "file_url", "file_size", "file_last_modified", "bbox"]
   var response = {
      available_data: []
   };
   var available = response.available_data;
   var sourceMap = {};

   flat.forEach(dataset => {
      var item = {};
      fields.forEach(field => {
         if (typeof dataset[field] !== "undefined") {
            item[field] = dataset[field];
         }
      });

      var data = sourceMap[dataset.source];
      if (!data) {
         data = {
            source: dataset.source,
            downloadables: {}
         };
         sourceMap[dataset.source] = data;
         available.push(data);
      }

      var downloadable = data.downloadables[dataset.type];
      if (!downloadable) {
         downloadable = {};
         data.downloadables[dataset.type] = downloadable;
      }

      var group = downloadable[dataset.group];
      if (!group) {
         group = [];
         downloadable[dataset.group] = group;
      }

      group.push(item);
   });

   return response;
}


module.exports = ServiceBroker;