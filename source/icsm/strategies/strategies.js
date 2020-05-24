class BaseStrategy {
   constructor($http) {
      this.http = $http;
      this.NO_METADATA = "Metadata";
   }

   constructLink(item) {
      return item.metadata_url ? item.metadata_url : null;
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
         then: function (fn) {
            this.fn = fn;
         }
      };

      setTimeout(function () {
         if (response.fn) {
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
      super(http); // https://ecat.ga.gov.au/geonetwork/srv/eng/xml.metadata.get?uuid=22be4b55-2465-4320-e053-10a3070a5236
      this.GA_LINK_METADATA_TEMPLATE = 'https://ecat.ga.gov.au/geonetwork/srv/eng/search#!${uuid}';
      this.GA_METADATA_TEMPLATE = 'https://ecat.ga.gov.au/geonetwork/srv/eng/xml.metadata.get?uuid=${uuid}';
      this.UUID_REG_EX = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;
   }

   constructLink(item) {
      if (item.metadata_url) {
         return item.metadata_url;
      }
      var uuid = item.metadata_id;
      return uuid ? this.GA_LINK_METADATA_TEMPLATE.replace("${uuid}", uuid) : null;
   }

   hasMetadata(item) {
      return !!this.constructLink(item);
   }

   requestMetadata(item) {
      var uuid = item.metadata_id;
      var url = uuid ? ("xml2js/" + this.GA_METADATA_TEMPLATE.replace("${uuid}", uuid)) : null;
      if (url) {
         return this.http.get(url).then(response => {
            return BaseStrategy.extractData(response.data);
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

class EftfStrategy extends BaseStrategy {
   constructor(http) {
      super(http);
   }

   constructLink(item) {
      return item.metadata_url;
   }

   requestMetadata(item) {
      return BaseStrategy.resolvedPromise({
         title: "View metadata in new page"
      });
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

      this.XML_METADATA_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/rest/document?id={metadata_id}&f=xml";
      this.QLD_METADATA_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/rest/document?id={EB442CAB-D714-40D8-82C2-A01CA4661324}&f=xml";
      this.QLD_HTML_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/custom/detail.page?fid={EB442CAB-D714-40D8-82C2-A01CA4661324}";
      this.FRASER_COAST_METADATA_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/rest/document?id={E8CEF5BA-A1B7-4DE5-A703-8161FD9BD3CF}&f=xml";
      this.FRASER_COAST_HTML_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/custom/detail.page?fid={E8CEF5BA-A1B7-4DE5-A703-8161FD9BD3CF}";
      this.FRASER_COAST_BOUNDS = [152.331, -26.003, 153.370, -24.692]; //  Extracted from metadata XML



   }

   constructLink(item) {
      if (item.metadata_url) {
         return item.metadata_url;
      }

      let bbox = item.bbox.split(",").map((val) => parseFloat(val.trim()));
      if (bbox[0] >= this.FRASER_COAST_BOUNDS[0] &&
         bbox[1] >= this.FRASER_COAST_BOUNDS[1] &&
         bbox[2] <= this.FRASER_COAST_BOUNDS[2] &&
         bbox[0] >= this.FRASER_COAST_BOUNDS[3]
      ) {
         return this.FRASER_COAST_HTML_TEMPLATE;
      } else {
         return this.QLD_HTML_TEMPLATE;
      }
   }

   hasMetadata(item) {
      return true;
   }

   requestMetadata(item) {
      let url;

      if (item.metadata_id) {
         url = this.XML_METADATA_TEMPLATE.replace("metadata_id", item.metadata_id);
      } else {
         url = this.QLD_METADATA_TEMPLATE;
         let bbox = item.bbox.split(",").map((val) => parseFloat(val.trim()));

         if (bbox[0] >= this.FRASER_COAST_BOUNDS[0] &&
            bbox[1] >= this.FRASER_COAST_BOUNDS[1] &&
            bbox[2] <= this.FRASER_COAST_BOUNDS[2] &&
            bbox[0] >= this.FRASER_COAST_BOUNDS[3]
         ) {
            url = this.FRASER_COAST_METADATA_TEMPLATE;
         }
      }

      return this.http.get("xml2js/" + url).then(response => {
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

      this.strategies = [{
            name: "NSW Government",
            strategy: new NswStrategy(http)
         },
         {
            name: "VIC Government",
            strategy: unknown, // new VicStrategy(http)
         },
         {
            name: "SA Government",
            strategy: unknown, // new SaStrategy(http),
         },
         {
            name: "WA Government",
            strategy: unknown, // new WaStrategy(http),
         },
         {
            name: "QLD Government",
            strategy: new QldStrategy(http)
         },
         {
            name: "ACT Government",
            strategy: unknown, // new ActStrategy(http)
         },
         {
            name: "NT Government",
            strategy: unknown, // new NtStrategy(http)
         },
         {
            name: "TAS Government",
            strategy: unknown, // new TasStrategy(http)
         },
         {
            name: "Geoscience Australia",
            strategy: new GaStrategy(http)
         },
         {
            name: "Exploring for the Future",
            strategy: new EftfStrategy(http)
         }
      ];
   }

   strategy(name) {
      var metadata = this.strategies.find(unit => unit.name && name.indexOf(unit.name) === 0);
      return metadata ? metadata.strategy : this.unknown;
   }
}