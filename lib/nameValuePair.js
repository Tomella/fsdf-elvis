
class NameValuePair {
   constructor(str) {
      if(str) {
         this.pair = str.split("=");
      }
   }

   get name() {
      return this.pair[0];
   }

   get value() {
      return this.pair[1];
   }

   get isValid() {
      return this.key && this.value;
   }
}

module.exports = NameValuePair;