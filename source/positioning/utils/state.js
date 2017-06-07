class State {
   get isCsv() {
      return this.extension === 'csv';
   }

   get isShapefile() {
      return this.extension === 'shp';
   }

   get full() {
      let files = this.file;
      if (!files) {
         return false;
      }

      let response = files.dbf && files.prj && files.shp && files.shx;
      console.log("Response = " + response);
      return response;
   }

   get validFileInfo() {
      // It's either CSV or SHP at the moment
      return this.isCsv ? this.validCsvFileInfo : this.validShpFileInfo;
   }

   get validShpFileInfo() {
      return true;
   }

   get validCsvFileInfo() {
      let result = this.latDegreesCol && this.lngDegreesCol && this.isEpsg4283;

      if (this.dmsType === "dms") {
         result &= this.latMinutesCol &&
            this.latSecondsCol &&
            this.lngMinutesCol &&
            this.lngSecondsCol;
      }
      return result;
   }

   get validEmail() {
      // We assume they only put in valid email addresses
      return !!this.email;
   }

   get acceptedEpsg4283() {
      // We assume they only put in valid email addresses
      return !!this.isEpsg4283;
   }

   get validFilename() {
      // We assume they only put in valid filename
      return !!this.outputName;
   }

   get validOutFormat() {
      // We assume they only put in valid email addresses
      return !!this.outFormat;
   }

   get validForm() {
      return this.percentage > 99.99; // Scared of errors.
   }

   get percentage() {
      if (!this.file) {
         return 0;
      }

      let count = 0;
      let parts = 3;

      count += this.validEmail ? 1 : 0
      count += this.acceptedEpsg4283 ? 1 : 0
      count += this.transformation ? 1 : 0

      if (this.isCsv) {
         parts += 2;

         count += this.latDegreesCol ? 1 : 0
         count += this.lngDegreesCol ? 1 : 0

         if (this.dmsType === "dms") {
            parts += 4;

            count += this.latMinutesCol ? 1 : 0
            count += this.lngMinutesCol ? 1 : 0
            count += this.latSecondsCol ? 1 : 0
            count += this.lngSecondsCol ? 1 : 0
         }

      } else if (this.isShapefile) {
         Object.keys(this.file).forEach(key => count += this.file[key] ? 1 : 0)
         parts +=4;
      }

      return 100 * count / parts;
   }
}
