class State {
   get isCsv() {
      return this.extension === 'csv';
   }

   get isShapefile() {
      return this.extension === 'shp';
   }

   get validFileInfo() {
      // It's either CSV or SHP at the moment
      return this.isCsv ? this.validCsvFileInfo : this.validShpFileInfo;
   }

   get validShpFileInfo() {
      return true;
   }

   get validCsvFileInfo() {
      let result = this.latDegreesCol && this.lngDegreesCol;

      if (this.dmsType === "dms") {
         result = result && this.latMinutesCol &&
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

   get validFilename() {
      // We assume they only put in valid filename
      return !!this.outputName;
   }

   get validOutFormat() {
      // We assume they only put in valid email addresses
      return !!this.outFormat;
   }

   get validOutCoordSys() {
      // We assume they only put in valid coord system
      return !!this.outCoordSys;
   }

   get validForm() {
      return this.percentage > 99.99; // Scared of errors.
   }

   get percentage() {
      if (!this.file) {
         return 0;
      }

      let count = 0;
      let parts = 2;

      count += this.validFilename ? 1 : 0
      count += this.validEmail ? 1 : 0

      if (this.isCsv) {
         parts += 4;

         count += this.validOutCoordSys ? 1 : 0
         count += this.validOutFormat ? 1 : 0

         count += this.latDegreesCol ? 1 : 0
         count += this.lngDegreesCol ? 1 : 0

         if (this.dmsType === "dms") {
            parts += 4;

            count += this.latMinutesCol ? 1 : 0
            count += this.lngMinutesCol ? 1 : 0
            count += this.latSecondsCol ? 1 : 0
            count += this.lngSecondsCol ? 1 : 0
         }

      } else if (this.dmsType === "shp") {
         parts = 6;
      }

      return 100 * count / parts;
   }
}
