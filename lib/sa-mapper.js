class SaMapper {
   constructor(options) {
      this.options = options;
   }

   createPath(id) {
      return this.options.xmlTemplate.replace("${id}", id);
   }

   transform(custom) {
      let response = {
         features: []
      };

      if (custom && custom.FeatureCollection && custom.FeatureCollection.featureMember && custom.FeatureCollection.featureMember.Gazetteer) {
         response.features.push(this.transformFeature(custom.FeatureCollection.featureMember.Gazetteer));
      }
      return response;
   }

   transformFeature(feature) {
      let response = {
         attributes:{
            Record_ID: getText(feature.RECNO),
            Name: getText(feature.NAME),
            CGDN:"N",
            Authority_ID:"SA",
            Concise_gaz:getText(feature.CON_GAZ),
            Latitude: getNum(feature.GDA94_LAT), // -26.68019,
            // Lat_degrees:-26,
            // Lat_minutes:40,
            // Lat_seconds:48,
            Longitude: getNum(feature.GDA94_LONG), // 140.05321000000001,
            // Long_degrees:140,
            // Long_minutes:3,
            // Long_seconds:11,
            // Postcode:null,
            State_ID:"SA",
            // Status:"O",
            Variant_Name: getText(feature.ALTNAME),
            // Map_100K:6944,
            // Place_ID:360503,
            // OBJECTID:64098,
            Feature_code: getText(feature.F_CODE),
            Authority:"South Australia",
            Status_desc:"Official",
            State:"South Australia",
            Classification: getText(feature.FEATURE_CLASS) ,
            // Class_code:"L",
            Name_State_Combine:  getText(feature.NAME) + " (SA)"
         }
      };

      let attributes = response.attributes;
      attributes.NameU = attributes.Name.toUpperCase();
      attributes.Variant_NameU = attributes.Variant_Name.toUpperCase();

      response.geometry = {
         x: attributes.Longitude,
         y: attributes.Latitude
      };

      return response;
   }
}

function getText(node) {
   if (!node || !node.__text) {
      return "";
   }
   return node.toString();
}

function getNum(node) {
   let text = getText(node);

   if (!text) {
      return "";
   }
   return +text;
}

module.exports = SaMapper;