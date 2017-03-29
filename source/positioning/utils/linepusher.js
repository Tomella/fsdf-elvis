class LinePusher {

   constructor(file) {
      this.PAGE_SIZE = 16 * 1024;
      this.file = file;
      this.length = file.size;
      this.pageNo = -1;
      this.index = 0;
      this.reader = new FileReader();
      this.lineBuffer = [];
   }

   start(targetFn) {
      // Prime the first read
      let result = this.read();

      while (result) {
         let lineResult = this.next();
         switch (lineResult.state) {
            case "more":
               result = this.read();
               break;
            case "line":
               targetFn(lineResult.line);
               break;
            case "complete":
               targetFn(lineResult.line);
               result = false;
               break;
         }
      }
   }

   read() {
      this.pageNo++;
      this.index = 0;
      let self = this;
      let start = this.pageNo * this.PAGE_SIZE;

      let blob = this.file.slice(start, start + this.PAGE_SIZE);

      this.reader.readAsText(blob);
      return new Promise(resolve => {
         if (start >= this.length) {
            resolve(false);
            return;
         }

         self.reader.onloadend = (evt) => {
            if (evt.target["readyState"] === FileReader.prototype.DONE) { // DONE == 2
               console.log("Reading page " + self.pageNo);
               self.buffer = evt.target["result"];
               resolve(this.hasMore());
            }
         };
      });
   }

   hasMore() {
      return this.index + this.PAGE_SIZE * this.pageNo < this.length - 1;
   }

   next() {
      while (this.hasMore()) {
         if (!this.buffer || this.index >= this.PAGE_SIZE)  {
            return {state: "more"};
         }
         let char = this.buffer[this.index++];
         if (char === "\r") {
            continue;
         }
         if (char === "\n") {
            break;
         }
         this.lineBuffer.push(char);
      }
      let line = this.lineBuffer.join("");
      this.lineBuffer = [];
      return {
         state: this.hasMore() ? "line" : "complete",
         line: line
      };
   }
}
