class BaseStrategy {
   constructor($http) {
      this.http = $http;
      this.NO_METADATA = "No metadata found for this dataset.";
   }

   constructLink(item) {
      return null;
   }

   hasMetadata(item) {
      return false;
   }

   requestMetadata(item) {
      return BaseStrategy.resolvedPromise({
         title: this.NO_METADATA
      });
   }

   static resolvedPromise(data) {
      // Create a very poor man's promise for IE11 or anybody really. It'll work anywhere.
      var response = {
         then: function(fn) {
            this.fn = fn;
         }
      };

      setTimeout(function() {
         if(response.fn) {
            response.fn(data);
         }
      }, 1);

      return response;
   }

   static extractData(wrapper) {
      var metadata = wrapper.MD_Metadata;
      var data = {};

      var node = metadata &&
         metadata.identificationInfo &&
         metadata.identificationInfo.MD_DataIdentification;
      var abstractNode = node;

      node = node &&
         node.citation &&
         node.citation.CI_Citation;
      node = node &&
         node.title &&
         node.title.CharacterString;

      if (node) {
         data.title = node.__text;

         let abstract = abstractNode &&
            abstractNode.abstract &&
            abstractNode.abstract.CharacterString &&
            abstractNode.abstract.CharacterString.__text;
         data.abstract = data.abstractText = abstract;
      } else {
         data.title = super.NO_METADATA;
      }
      return data;
   }
}

class UnknownStrategy extends BaseStrategy {
   constructor(http) {
      super(http);
   }
}

class ActStrategy extends BaseStrategy {
   constructor(http) {
      super(http);
   }
}

class GaStrategy extends BaseStrategy {
   constructor(http) {
      super(http);
      this.GA_METADATA_TEMPLATE = 'http://www.ga.gov.au/metadata-gateway/metadata/record/gcat_${uuid}';
      this.UUID_REG_EX = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;
   }

   constructLink(item) {
      var uuid = item.metadata_id;
      return uuid ? this.GA_METADATA_TEMPLATE.replace("${uuid}", uuid) : null;
   }

   hasMetadata(item) {
      return !!this.constructLink(item);
   }

   requestMetadata(item) {
      var uuid = item.metadata_id;
      var url = uuid ? ("xml2js/" + this.GA_METADATA_TEMPLATE.replace("${uuid}", uuid) + "/xml") : null;
      if(url) {
         return this.http.get(url).then(response => {
            return BaseStrategy.extractData(response.data.GetRecordByIdResponse);
         }, err => {
            return {
               title: this.NO_METADATA
            };
         });
      } else {
         return BaseStrategy.resolvedPromise({
            title: this.NO_METADATA
         });
      }
   }
}

class NswStrategy extends BaseStrategy {
   constructor(http) {
      super(http);
      this.NSW_METADATA_TEMPLATE = "https://s3-ap-southeast-2.amazonaws.com/nsw.elvis/z5${zone}/Metadata/";
   }

   constructLink(item) {
      var filename = item.file_name;
      var re = /\_5\d\_/;
      var index = filename.search(re);
      var zone = 6;
      var url = this.NSW_METADATA_TEMPLATE;
      if (index !== -1) {
         zone = filename.substr(index + 2, 1);
      }
      return url.replace("${zone}", zone) + filename.replace(".zip", "_Metadata.html");
   }

   hasMetadata(item) {
      return true;
   }

   requestMetadata(item) {
      var filename = item.file_name;
      var re = /\_5\d\_/;
      var index = filename.search(re);
      var zone = 6;
      var url = this.NSW_METADATA_TEMPLATE;
      if (index !== -1) {
         zone = filename.substr(index + 2, 1);
      }
      url = "xml2js/" + url.replace("${zone}", zone) + filename.replace(".zip", "_Metadata.xml");

      return this.http.get(url).then(response => {
         return BaseStrategy.extractData(response.data);
      }, err => {
         return {
            title: super.NO_METADATA
         };
      });
   }
}

class NtStrategy extends BaseStrategy {
   constructor(http) {
      super(http);
   }
}

class QldStrategy extends BaseStrategy {
   constructor(http) {
      super(http);
      this.QLD_METADATA_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/rest/document?id={EB442CAB-D714-40D8-82C2-A01CA4661324}&f=xml";
      this.QLD_HTML_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/custom/detail.page?fid={EB442CAB-D714-40D8-82C2-A01CA4661324}";
   }

   constructLink(item) {
      var filename = item.file_name;
      var re = /\_5\d\_/;
      var index = filename.search(re);
      var zone = 6;
      var url = this.QLD_HTML_TEMPLATE;
      if (index !== -1) {
         zone = filename.substr(index + 2, 1);
      }
      return url.replace("${zone}", zone);
   }

   hasMetadata(item) {
      return true;
   }

   requestMetadata(item) {
      var filename = item.file_name;
      var re = /\_5\d\_/;
      var index = filename.search(re);
      var zone = 6;
      var url = this.QLD_METADATA_TEMPLATE;
      if (index !== -1) {
         zone = filename.substr(index + 2, 1);
      }
      url = "xml2js/" + url.replace("${zone}", zone);

      return this.http.get(url).then(response => {
         return BaseStrategy.extractData(response.data);
      }, err => {
         return {
            title: super.NO_METADATA
         };
      });
   }
}

class SaStrategy extends BaseStrategy {
   constructor(http) {
      super(http);
   }
}

class TasStrategy extends BaseStrategy {
   constructor(http) {
      super(http);
   }
}

class VicStrategy extends BaseStrategy {
   constructor(http) {
      super(http);
   }
}

class WaStrategy extends BaseStrategy {
   constructor(http) {
      super(http);
   }
}

class Strategies {
   constructor(http) {
      var unknown = this.unknown = new UnknownStrategy();

      this.strategies = {
         "NSW Government": new NswStrategy(http),
         "VIC Government": unknown, // new VicStrategy(http),
         "SA Government": unknown, // new SaStrategy(http),
         "WA Government": unknown, // new WaStrategy(http),
         "QLD Government": new QldStrategy(http),
         "ACT Government": unknown, // new ActStrategy(http),
         "NT Government": unknown, // new NtStrategy(http),
         "TAS Government": unknown, // new TasStrategy(http),
         "Geoscience Australia": new GaStrategy(http)
      };
   }

   strategy(name) {
      var strategy = this.strategies[name];
      return strategy ? strategy : this.unknown;
   }
}