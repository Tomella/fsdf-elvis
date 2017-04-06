/**
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var RootCtrl = function RootCtrl(configService) {
      var _this = this;

      _classCallCheck(this, RootCtrl);

      configService.getConfig().then(function (data) {
         _this.data = data;
         _this.state = new State();
      });
   };

   RootCtrl.$invoke = ['configService'];

   angular.module("PositioningApp", ['common.altthemes', 'common.navigation', 'common.storage', 'common.templates', 'common.toolbar', 'explorer.config', 'explorer.confirm', 'explorer.drag', 'explorer.enter', 'explorer.flasher', 'explorer.googleanalytics', 'explorer.httpdata', 'explorer.info', 'explorer.legend', 'explorer.message', 'explorer.modal', 'explorer.persist', 'explorer.projects', 'explorer.tabs', 'explorer.version', 'exp.ui.templates', 'positioning.download', 'positioning.file', 'positioning.filedrop', 'positioning.header', 'positioning.templates', 'ui.bootstrap', 'ui.bootstrap-slider', 'page.footer'])

   // Set up all the service providers here.
   .config(['configServiceProvider', 'projectsServiceProvider', 'versionServiceProvider', 'persistServiceProvider', function (configServiceProvider, projectsServiceProvider, versionServiceProvider, persistServiceProvider) {
      configServiceProvider.location("icsm/resources/config/positioning.json");
      configServiceProvider.dynamicLocation("icsm/resources/config/positioning.json?t=");
      versionServiceProvider.url("icsm/assets/package.json");
      projectsServiceProvider.setProject("icsm");
      persistServiceProvider.handler("local");
   }]).factory("userService", [function () {
      return {
         login: noop,
         hasAcceptedTerms: noop,
         setAcceptedTerms: noop,
         getUsername: function getUsername() {
            return {
               then: function then(fn) {
                  return fn("anon");
               }
            };
         }
      };
      function noop() {
         return true;
      }
   }]).controller("RootCtrl", RootCtrl).filter('bytes', function () {
      return function (bytes, precision) {
         if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
         if (typeof precision === 'undefined') precision = 0;
         var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
             number = Math.floor(Math.log(bytes) / Math.log(1024));
         return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
      };
   });
}
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var CsvService = function () {
      function CsvService($q, configService) {
         var _this = this;

         _classCallCheck(this, CsvService);

         this.$q = $q;
         configService.getConfig().then(function (config) {
            _this.blockSize = config.blockSize ? config.blockSize : 1024 * 8;
         });
      }

      _createClass(CsvService, [{
         key: "getColumns",
         value: function getColumns(file) {
            var blob = file.slice(0, this.blockSize);
            var reader = new FileReader();
            reader.readAsText(blob);
            return this.$q(function (resolve, reject) {
               reader.onloadend = function (evt) {
                  // console.log(evt.target["readyState"] + "\n\n" + evt.target["result"]);

                  if (evt.target["readyState"] === FileReader.prototype.DONE) {
                     // DONE == 2
                     var buffer = evt.target["result"];
                     if (buffer.length) {
                        // We don't read the whole file, just the start.
                        var lines = buffer.substr(0, buffer.lastIndexOf("\n"));
                        resolve(CSVToArray(lines));
                     } else {
                        reject(buffer);
                     }
                  }
               };
            });
         }
      }]);

      return CsvService;
   }();

   CsvService.$invoke = ["$q", "configService"];

   angular.module("positioning.csv", []).directive("csvFile", ["csvService", function (csvService) {
      return {
         templateUrl: "positioning/csv/csv.html",
         scope: {
            state: "=",
            settings: "="
         },
         link: function link(scope) {
            csvService.getColumns(scope.state.file).then(function (csv) {
               scope.columns = csv[0];
            });
         }
      };
   }]).service("csvService", CsvService);
}
"use strict";

{
   angular.module("positioning.dialog", ["positioning.filename", "positioning.mandatory", "positioning.output", "positioning.progress", "positioning.email"]).directive("uploadDialog", [function () {
      return {
         scope: {
            state: "=",
            settings: "="
         },
         templateUrl: "positioning/dialog/dialog.html",
         link: function link(scope) {
            scope.cancel = function () {
               scope.state = new State();
            };
         }
      };
   }]).directive("uploadSubmit", ['configService', 'edDownloadService', 'messageService', function (configService, edDownloadService, messageService) {
      return {
         templateUrl: "download/downloader/submit.html",
         scope: {
            item: "=",
            processing: "="
         },
         link: function link(scope, element, attrs) {
            scope.submit = function () {
               var processing = scope.processing;

               edDownloadService.setEmail(processing.email);

               // Assemble data
               edDownloadService.submit(scope.item.processing.template, {
                  id: scope.item.primaryId,
                  yMin: processing.clip.yMin,
                  yMax: processing.clip.yMax,
                  xMin: processing.clip.xMin,
                  xMax: processing.clip.xMax,
                  outFormat: processing.outFormat.code,
                  outCoordSys: processing.outCoordSys.code,
                  filename: processing.filename ? processing.filename : "",
                  email: processing.email
               });
               messageService.success("Submitted your job. An email will be delivered on completion.");
            };
         }
      };
   }]);
}
'use strict';

{
   angular.module('positioning.download', [])
   /**
    *
    * Override the original mars user.
    *
    */
   .directive('posDownload', [function () {
      return {
         restrict: 'AE',
         templateUrl: 'positioning/download/download.html',
         link: function link(scope) {}
      };
   }]);
}
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var EmailService = function () {
      function EmailService(persistService) {
         _classCallCheck(this, EmailService);

         this.persistService = persistService;
         this.key = "download_email";
      }

      _createClass(EmailService, [{
         key: "setEmail",
         value: function setEmail(email) {
            this.persistService.setItem(this.key, email);
         }
      }, {
         key: "getEmail",
         value: function getEmail() {
            return this.persistService.getItem(this.key);
         }
      }]);

      return EmailService;
   }();

   EmailService.$invoke = ["persistService"];

   angular.module("positioning.email", []).directive("email", ["emailService", function (emailService) {
      return {
         template: '<div class="input-group">' + '<span class="input-group-addon" id="pos-email">Email</span>' + '<input required="required" type="email" ng-change="changeEmail(state.email)" ng-model="state.email" class="form-control" placeholder="Email address to send download link" aria-describedby="nedf-email">' + '</div>',
         restrict: "AE",
         scope: {
            state: "="
         },
         link: function link(scope, element) {
            emailService.getEmail().then(function (email) {
               scope.state.email = email;
            });

            scope.changeEmail = function (email) {
               emailService.setEmail(email);
            };
         }
      };
   }]).service("emailService", EmailService);
}
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var FileController = function FileController() {
      _classCallCheck(this, FileController);
   };

   angular.module("positioning.file", ["positioning.format", "positioning.csv", "positioning.dialog"]).directive("file", function () {
      return {
         templateUrl: "positioning/file/file.html"
      };
   }).controller("fileController", FileController);
}
"use strict";

{
   angular.module("positioning.filename", []).directive("filename", [function () {
      return {
         scope: {
            state: "="
         },
         templateUrl: "positioning/filename/filename.html"
      };
   }]);
}
"use strict";

{
   angular.module("positioning.filedrop", []).directive("fileDrop", [function (scope) {
      return {
         templateUrl: "positioning/filedrop/filedrop.html",
         scope: {
            state: "="
         },
         link: function link(scope, element) {
            var fileDrop = new FileDrop(element[0], function (file) {
               scope.$apply(function () {
                  if (!scope.state.file) {
                     var name = file.name;
                     var ext = name.substr(name.lastIndexOf(".") + 1);
                     ext = ext ? ext.toLowerCase() : "";
                     scope.state.file = file;
                     scope.state.extension = ext;
                     scope.state.outputName = name.substr(0, name.lastIndexOf("."));
                  }
               });
            });
         }
      };
   }]);
}
"use strict";

{
   angular.module("positioning.format", []).directive("inputFormat", function () {
      return {
         scope: {
            list: "="
         },
         templateUrl: "positioning/formats/formats.html"
      };
   });
}
'use strict';

{
	angular.module('positioning.header', []).controller('headerController', ['$scope', '$q', '$timeout', function ($scope, $q, $timeout) {

		var modifyConfigSource = function modifyConfigSource(headerConfig) {
			return headerConfig;
		};

		$scope.$on('headerUpdated', function (event, args) {
			$scope.headerConfig = modifyConfigSource(args);
		});
	}]).directive('icsmHeader', [function () {
		var defaults = {
			heading: "ICSM",
			headingtitle: "ICSM",
			helpurl: "help.html",
			helptitle: "Get help about ICSM",
			helpalttext: "Get help about ICSM",
			skiptocontenttitle: "Skip to content",
			skiptocontent: "Skip to content",
			quicklinksurl: "/search/api/quickLinks/json?lang=en-US"
		};
		return {
			transclude: true,
			restrict: 'EA',
			templateUrl: "positioning/header/header.html",
			scope: {
				breadcrumbs: "=",
				heading: "=",
				headingtitle: "=",
				helpurl: "=",
				helptitle: "=",
				helpalttext: "=",
				skiptocontenttitle: "=",
				skiptocontent: "=",
				quicklinksurl: "="
			},
			link: function link(scope, element, attrs) {
				var data = angular.copy(defaults);
				angular.forEach(defaults, function (value, key) {
					if (!(key in scope)) {
						scope[key] = value;
					}
				});
			}
		};
	}]);
}
"use strict";

{
   angular.module("positioning.output", []).directive("outputFormat", function () {
      return {
         link: {
            state: "="
         },
         templateUrl: 'positioning/output/output.html'
      };
   });
}
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
   var SubmitService = function () {
      function SubmitService($http, configService) {
         var _this = this;

         _classCallCheck(this, SubmitService);

         this.$http = $http;
         configService.getConfig("submit").then(function (data) {
            _this.config = data;
         });
      }

      _createClass(SubmitService, [{
         key: "post",
         value: function post(data) {

            var formData = new FormData();
            formData.append('file', data.file);
            formData.append("email", data.email);
            formData.append("outFormat", data.outFormat);
            formData.append("outputName", data.outputName + ".zip");
            formData.append("email", data.email);

            return this.$http({
               url: this.config.template,
               method: 'POST',
               data: formData,
               //assign content-type as undefined, the browser
               //will assign the correct boundary for us
               headers: { 'Content-Type': undefined },
               //prevents serializing payload.  don't do it.
               transformRequest: angular.identity
            });

            function decorateFileData() {
               if (true) {}
            }
         }
      }]);

      return SubmitService;
   }();

   SubmitService.$inject = ["$http", "configService"];

   angular.module("positioning.progress", []).directive("progressBar", ["submitService", function (submitService) {
      return {
         scope: {
            state: "="
         },
         templateUrl: "positioning/progress/progress.html",
         link: function link(scope) {
            scope.submit = function () {
               submitService.post(scope.state);
            };
         }
      };
   }]).service("submitService", SubmitService);
}
"use strict";

function CSVToArray(strData, strDelimiter) {
   // Check to see if the delimiter is defined. If not,
   // then default to comma.
   strDelimiter = strDelimiter || ",";

   // Create a regular expression to parse the CSV values.
   var objPattern = new RegExp(
   // Delimiters.
   "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

   // Quoted fields.
   "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

   // Standard fields.
   "([^\"\\" + strDelimiter + "\\r\\n]*))", "gi");

   // Create an array to hold our data. Give the array
   // a default empty first row.
   var arrData = [[]];

   // Create an array to hold our individual pattern
   // matching groups.
   var arrMatches = null;

   // Keep looping over the regular expression matches
   // until we can no longer find a match.
   while (arrMatches = objPattern.exec(strData)) {

      // Get the delimiter that was found.
      var strMatchedDelimiter = arrMatches[1];

      // Check to see if the given delimiter has a length
      // (is not the start of string) and if it matches
      // field delimiter. If id does not, then we know
      // that this delimiter is a row delimiter.
      if (strMatchedDelimiter.length && strMatchedDelimiter != strDelimiter) {

         // Since we have reached a new row of data,
         // add an empty row to our data array.
         arrData.push([]);
      }

      // Now that we have our delimiter out of the way,
      // let's check to see which kind of value we
      // captured (quoted or unquoted).
      if (arrMatches[2]) {

         // We found a quoted value. When we capture
         // this value, unescape any double quotes.
         var strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"");
      } else {

         // We found a non-quoted value.
         var strMatchedValue = arrMatches[3];
      }

      // Now that we have our value string, let's add
      // it to the data array.
      arrData[arrData.length - 1].push(strMatchedValue);
   }

   // Return the parsed data.
   return arrData;
}
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FileDrop = function FileDrop(element, handler) {
   _classCallCheck(this, FileDrop);

   if (!handler || typeof handler !== "function") {
      throw Error("No file handler provided");
   }

   if (!element) {
      throw Error("No element provided");
   }

   element.addEventListener("dragenter", dragenter, false);
   element.addEventListener("dragover", dragover, false);
   element.addEventListener("drop", drop, false);

   function dragenter(e) {
      e.stopPropagation();
      e.preventDefault();
      console.log("dragenter");
   }

   function dragover(e) {
      e.stopPropagation();
      e.preventDefault();
      console.log("dragover");
   }

   function drop(e) {
      e.stopPropagation();
      e.preventDefault();

      var dt = e.dataTransfer;
      var files = dt.files;
      handleFiles(files);
   }

   function handleFiles(files) {
      if (files) {
         for (var i = 0; i < files.length; i++) {
            handler(files.item(i));
         }
      }
   }
};
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LinePusher = function () {
   function LinePusher(file) {
      _classCallCheck(this, LinePusher);

      this.PAGE_SIZE = 16 * 1024;
      this.file = file;
      this.length = file.size;
      this.pageNo = -1;
      this.index = 0;
      this.reader = new FileReader();
      this.lineBuffer = [];
   }

   _createClass(LinePusher, [{
      key: "start",
      value: function start(targetFn) {
         // Prime the first read
         var result = this.read();

         while (result) {
            var lineResult = this.next();
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
   }, {
      key: "read",
      value: function read() {
         var _this = this;

         this.pageNo++;
         this.index = 0;
         var self = this;
         var start = this.pageNo * this.PAGE_SIZE;

         var blob = this.file.slice(start, start + this.PAGE_SIZE);

         this.reader.readAsText(blob);
         return new Promise(function (resolve) {
            if (start >= _this.length) {
               resolve(false);
               return;
            }

            self.reader.onloadend = function (evt) {
               if (evt.target["readyState"] === FileReader.prototype.DONE) {
                  // DONE == 2
                  console.log("Reading page " + self.pageNo);
                  self.buffer = evt.target["result"];
                  resolve(_this.hasMore());
               }
            };
         });
      }
   }, {
      key: "hasMore",
      value: function hasMore() {
         return this.index + this.PAGE_SIZE * this.pageNo < this.length - 1;
      }
   }, {
      key: "next",
      value: function next() {
         while (this.hasMore()) {
            if (!this.buffer || this.index >= this.PAGE_SIZE) {
               return { state: "more" };
            }
            var char = this.buffer[this.index++];
            if (char === "\r") {
               continue;
            }
            if (char === "\n") {
               break;
            }
            this.lineBuffer.push(char);
         }
         var line = this.lineBuffer.join("");
         this.lineBuffer = [];
         return {
            state: this.hasMore() ? "line" : "complete",
            line: line
         };
      }
   }]);

   return LinePusher;
}();
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var State = function () {
   function State() {
      _classCallCheck(this, State);
   }

   _createClass(State, [{
      key: 'isCsv',
      get: function get() {
         return this.extension === 'csv';
      }
   }, {
      key: 'isShapefile',
      get: function get() {
         return this.extension === 'shp';
      }
   }, {
      key: 'validFileInfo',
      get: function get() {
         // It's either CSV or SHP at the moment
         return this.isCsv ? this.validCsvFileInfo : this.validShpFileInfo;
      }
   }, {
      key: 'validShpFileInfo',
      get: function get() {
         return true;
      }
   }, {
      key: 'validCsvFileInfo',
      get: function get() {
         var result = this.latDegreesCol && this.lngDegreesCol;

         if (this.dmsType === "dms") {
            result = result && this.latMinutesCol && this.latSecondsCol && this.lngMinutesCol && this.lngSecondsCol;
         }
         return result;
      }
   }, {
      key: 'validEmail',
      get: function get() {
         // We assume they only put in valid email addresses
         return !!this.email;
      }
   }, {
      key: 'validFilename',
      get: function get() {
         // We assume they only put in valid filename
         return !!this.outputName;
      }
   }, {
      key: 'validOutFormat',
      get: function get() {
         // We assume they only put in valid email addresses
         return !!this.outFormat;
      }
   }, {
      key: 'validOutCoordSys',
      get: function get() {
         // We assume they only put in valid coord system
         return !!this.outCoordSys;
      }
   }, {
      key: 'validForm',
      get: function get() {
         return this.percentage > 99.99; // Scared of errors.
      }
   }, {
      key: 'percentage',
      get: function get() {
         if (!this.file) {
            return 0;
         }

         var count = 0;
         var parts = 2;

         count += this.validFilename ? 1 : 0;
         count += this.validEmail ? 1 : 0;

         if (this.isCsv) {
            parts += 4;

            count += this.validOutCoordSys ? 1 : 0;
            count += this.validOutFormat ? 1 : 0;

            count += this.latDegreesCol ? 1 : 0;
            count += this.lngDegreesCol ? 1 : 0;

            if (this.dmsType === "dms") {
               parts += 4;

               count += this.latMinutesCol ? 1 : 0;
               count += this.lngMinutesCol ? 1 : 0;
               count += this.latSecondsCol ? 1 : 0;
               count += this.lngSecondsCol ? 1 : 0;
            }
         } else if (this.dmsType === "shp") {
            parts = 6;
         }

         return 100 * count / parts;
      }
   }]);

   return State;
}();
"use strict";

{
   angular.module("positioning.mandatory", []).directive("mandatory", function () {
      return {
         template: '<span class="mandatory" title="You must provide a value">*</span>'
      };
   });
}
angular.module("positioning.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("positioning/csv/csv.html","<div>\r\n  <h4>Just a few questions about your CSV file</h4>\r\n  <div>\r\n		<div class=\"row\">\r\n			<div class=\"col-md-3\">\r\n				<label for=\"geoprocessOutCoordSys\">\r\n					Coordinate System<mandatory />\r\n				</label>\r\n			</div>\r\n			<div class=\"col-md-9\">\r\n				<select id=\"geoprocessOutCoordSys\" style=\"width:95%\" ng-model=\"state.outCoordSys\"\r\n                  ng-options=\"opt.value for opt in settings.processing.inCoordSys\"></select>\r\n			</div>\r\n		</div>\r\n\r\n      <div class=\"row\">\r\n			<div class=\"col-md-3 csv-label\">\r\n				Lat/lng fields are in<mandatory />\r\n			</div>\r\n			<div class=\"col-md-9\">\r\n				<label for=\"csvDegrees\">\r\n               Decimal degrees (2 cols)\r\n				</label>\r\n            <input name=\"csvDegrees\" type=\"radio\" value=\"deg\" ng-model=\"state.dmsType\" />\r\n            or\r\n				<label for=\"csvDms\">\r\n               Degrees/minutes/seconds (6 cols)\r\n				</label>\r\n            <input name=\"csvDms\" type=\"radio\" value=\"dms\" ng-model=\"state.dmsType\" />\r\n			</div>\r\n      </div>\r\n\r\n      <div class=\"row\" ng-if=\"state.dmsType == \'deg\'\">\r\n			<div class=\"col-md-3 csv-label\">\r\n				Columns\r\n			</div>\r\n			<div class=\"col-md-9\">\r\n				<label for=\"csvSelectLatDecDegrees\" style=\"width:9em\">\r\n               Latitude<mandatory />\r\n				</label>\r\n            <select id=\"csvSelectLatDecDegrees\" ng-model=\"state.latDegreesCol\"\r\n                  ng-options=\"o as o for o in columns\"></select>\r\n            <br/>\r\n				<label for=\"csvSelectLngDecDegrees\" style=\"width:9em\">\r\n               Longitude<mandatory />\r\n				</label>\r\n            <select id=\"csvSelectLngDecDegrees\" ng-model=\"state.lngDegreesCol\"\r\n                  ng-options=\"o as o for o in columns\"></select>\r\n			</div>\r\n      </div>\r\n\r\n\r\n      <div class=\"row\" ng-if=\"state.dmsType == \'dms\'\">\r\n			<div class=\"col-md-3 csv-label\">\r\n				Columns\r\n			</div>\r\n			<div class=\"col-md-9 csv-fix-label\">\r\n				<label for=\"csvSelectLatDegrees\">\r\n               Latitude Degrees<mandatory />\r\n				</label>\r\n            <select id=\"csvSelectLatDegrees\" ng-model=\"state.latDegreesCol\"\r\n                  ng-options=\"o as o for o in columns\"></select>\r\n            <br/>\r\n				<label for=\"csvSelectLatMinutes\">\r\n               Minutes<mandatory />\r\n				</label>\r\n            <select id=\"csvSelectLatMinutes\" ng-model=\"state.latMinutesCol\"\r\n                  ng-options=\"o as o for o in columns\"></select>\r\n            <br/>\r\n				<label for=\"csvSelectLatSeconds\">\r\n               Seconds<mandatory />\r\n				</label>\r\n            <select id=\"csvSelectLatSeconds\" ng-model=\"state.latSecondsCol\"\r\n                  ng-options=\"o as o for o in columns\"></select>\r\n            <br/>\r\n   			<label for=\"csvSelectLngDegrees\">\r\n               Longitude Degrees<mandatory />\r\n				</label>\r\n            <select id=\"csvSelectLngDegrees\" ng-model=\"state.lngDegreesCol\"\r\n                  ng-options=\"o as o for o in columns\"></select>\r\n            <br/>\r\n				<label for=\"csvSelectLngMinutes\">\r\n               Minutes<mandatory />\r\n				</label>\r\n            <select id=\"csvSelectLngMinutes\" ng-model=\"state.lngMinutesCol\"\r\n                  ng-options=\"o as o for o in columns\"></select>\r\n            <br/>\r\n				<label for=\"csvSelectLngSeconds\">\r\n               Seconds<mandatory />\r\n				</label>\r\n            <select id=\"csvSelectLngSeconds\" ng-model=\"state.lngSecondsCol\"\r\n                  ng-options=\"o as o for o in columns\"></select>\r\n\r\n			</div>\r\n      </div>\r\n      <hr/>\r\n      <output-format state=\"state\" />\r\n  </div>\r\n</div>");
$templateCache.put("positioning/dialog/dialog.html","<div class=\"upload-dialog\">\r\n   <p style=\"font-weight: bold\" class=\"bg-info\" ng-if=\"!state.file\">\r\n      <i class=\"fa fa-hand-o-left point-at-box fa-2x\" aria-hidden=\"true\" style=\"padding-right:12px;\"></i>\r\n      Select and drop file for reprojection\r\n   </p>\r\n   <div ng-if=\"state.file\">\r\n      <h3>Selected {{state.file.name}} ({{state.file.size | bytes}})</h3>\r\n   </div>\r\n   <div style=\"text-align:right\" ng-if=\"state.file.size > settings.maxFileSize\">\r\n      The size of the file to be uploaded must not exceed {{settings.maxFileSize | bytes}}. Please select a smaller file.\r\n      <button type=\"button\" class=\"btn btn-primary\" ng-click=\"cancel()\">OK</button>\r\n   </div>\r\n   <hr />\r\n   <div ng-show=\"state.file && state.file.size < settings.maxFileSize\">\r\n      <div ng-if=\"state.extension == \'csv\'\">\r\n         <csv-file state=\"state\" settings=\"settings\" />\r\n      </div>\r\n      <div ng-if=\"state.extension == \'shp\'\">\r\n         <shp-file state=\"state\" settings=\"settings\" />\r\n      </div>\r\n   </div>\r\n   <hr/>\r\n   <div ng-show=\"state.file\">\r\n      <div>\r\n         <h4>Output filename of your reprojection<mandatory /></h4>\r\n         <filename state=\"state\" />\r\n      </div>\r\n      <div>\r\n         <h4>Nominate your notification email address<mandatory /></h4>\r\n         <email state=\"state\" />\r\n      </div>\r\n\r\n      <div style=\"padding-top: 10px\">\r\n         <progress-bar state=\"state\" />\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("positioning/dialog/submit.html","<div style=\"padding-bottom:2px\">\r\n   <div class=\"row\">\r\n      <div class=\"col-md-6\" style=\"padding-top:7px\">\r\n         <div class=\"progress\">\r\n            <div class=\"progress-bar\" role=\"progressbar\" aria-valuenow=\"{{state.percentComplete}}\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: {{state.percentComplete}}%;\">\r\n                <span class=\"sr-only\">60% Complete</span>\r\n            </div>\r\n         </div>\r\n      </div>\r\n      <div class=\"col-md-4\" style=\"padding-top:7px\">\r\n         <span style=\"padding-right:10px\" uib-tooltip=\"Select a valid coordinate system.\" tooltip-placement=\"left\">\r\n            <i class=\"fa fa-crosshairs fa-2x\" ng-class=\"{\'ed-valid\': state.validProjection, \'ed-invalid\': !state.validProjection }\"></i>\r\n         </span>\r\n         <span style=\"padding-right:10px\" uib-tooltip=\"Select a latitude and longitude columns.\" tooltip-placement=\"left\">\r\n            <i class=\"fa fa-arrows fa-2x\" ng-class=\"{\'ed-valid\': state.validFields, \'ed-invalid\': !state.validFields}\"></i>\r\n         </span>\r\n         <span style=\"padding-right:10px\" uib-tooltip=\"Select a valid download format.\" tooltip-placement=\"left\">\r\n            <i class=\"fa fa-files-o fa-2x\" ng-class=\"{\'ed-valid\': state.validFormat, \'ed-invalid\': !state.validFormat}\"></i>\r\n         </span>\r\n         <span style=\"padding-right:10px\" uib-tooltip=\"Provide an email address.\" tooltip-placement=\"left\">\r\n            <i class=\"fa fa-envelope fa-2x\" ng-class=\"{\'ed-valid\': state.validEmail, \'ed-invalid\': !state.validEmail}\"></i>\r\n         </span>\r\n      </div>\r\n      <div class=\"col-md-2\">\r\n         <button type=\"button\" class=\"btn btn-primary\" ng-click=\"cancel()\">Cancel</button>\r\n         <button type=\"button\" ng-disabled=\"!state.ready\" class=\"btn btn-primary\">Submit</button>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("positioning/file/file.html","<div class=\"container-fluid file-container\" ng-controller=\"RootCtrl as root\">\r\n   <div class=\"row\">\r\n      <div class=\"col-md-6\" style=\"border-right: 2px solid lightgray\">\r\n         <h3>Paragraph 1</h3>\r\n         Lorem ipsum dolor sit amet Consectetur adipiscing elit Integer molestie lorem at massa Facilisis in pretium nisl aliquet\r\n         Nulla volutpat aliquam velit Phasellus iaculis neque Purus sodales ultricies Vestibulum laoreet porttitor sem Ac\r\n         tristique libero volutpat at Faucibus porta lacus fringilla vel Aenean sit amet erat nunc Eget porttitor lorem\r\n\r\n         <file-drop state=\"root.state\" />\r\n\r\n         <h3>Paragraph 2</h3>\r\n         Lorem ipsum dolor sit amet Consectetur adipiscing elit Integer molestie lorem at massa Facilisis in pretium nisl aliquet\r\n         Nulla volutpat aliquam velit Phasellus iaculis neque Purus sodales ultricies Vestibulum laoreet porttitor sem Ac\r\n         tristique libero volutpat at Faucibus porta lacus fringilla vel Aenean sit amet erat nunc Eget porttitor lorem\r\n         <br/>\r\n         <br/>\r\n         <input-format list=\"root.data.fileUploadFormats\" />\r\n      </div>\r\n      <div class=\"col-md-6\" >\r\n         <upload-dialog state=\"root.state\" settings=\"root.data\"/>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("positioning/filename/filename.html","<div class=\"input-group\">\r\n   <span class=\"input-group-addon\" id=\"nedf-filename\">Filename</span>\r\n   <input type=\"text\" ng-maxlength=\"30\" ng-trim=\"true\" ng-keypress=\"restrict($event)\"\r\n         ng-model=\"state.outputName\" class=\"form-control\"\r\n         placeholder=\"Filename\" aria-describedby=\"pos-filename\" />\r\n   <span class=\"input-group-addon\" id=\"basic-addon2\">.zip</span>\r\n</div>");
$templateCache.put("positioning/filedrop/filedrop.html","<div id=\"fileDrop\" title=\"Drop a file you would like to reproject to GDA2020\">\r\n   <br/> Drop <br/> File <br/> Here\r\n</div>");
$templateCache.put("positioning/formats/formats.html","<div class=\"panel panel-default\">\r\n  <div class=\"panel-heading\"><h3 class=\"panel-title\">Allowed input file types</h3></div>\r\n  <div class=\"panel-body\">\r\n    <span class=\"label label-info input-format-pill\" ng-repeat=\"item in list\" title=\"{{item.description}} Extensions: {{item.extensions.join(\', \')}}\">\r\n       <a ng-href=\"{{item.url}}\" target=\"_blank\">{{item.name}}</a>\r\n    </span>\r\n  </div>\r\n</div>");
$templateCache.put("positioning/header/header.html","<div class=\"container-full common-header\" style=\"padding-right:10px; padding-left:10px\">\r\n    <div class=\"navbar-header\">\r\n\r\n        <button type=\"button\" class=\"navbar-toggle\" data-toggle=\"collapse\" data-target=\".ga-header-collapse\">\r\n            <span class=\"sr-only\">Toggle navigation</span>\r\n            <span class=\"icon-bar\"></span>\r\n            <span class=\"icon-bar\"></span>\r\n            <span class=\"icon-bar\"></span>\r\n        </button>\r\n        <a href=\"/\" class=\"appTitle visible-xs\">\r\n            <h1 style=\"font-size:120%\">{{heading}}</h1>\r\n        </a>\r\n    </div>\r\n    <div class=\"navbar-collapse collapse ga-header-collapse\">\r\n        <ul class=\"nav navbar-nav\">\r\n            <li class=\"hidden-xs\"><a href=\"/\"><h1 class=\"applicationTitle\">{{heading}}</h1></a></li>\r\n        </ul>\r\n        <ul class=\"nav navbar-nav navbar-right nav-icons\">\r\n        	<li common-navigation ng-show=\"username\" role=\"menuitem\" style=\"padding-right:10px\"></li>\r\n			<li mars-version-display role=\"menuitem\"></li>\r\n			<li style=\"width:10px\"></li>\r\n        </ul>\r\n    </div><!--/.nav-collapse -->\r\n</div>\r\n\r\n<!-- Strap -->\r\n<div class=\"row\">\r\n    <div class=\"col-md-12\">\r\n        <div class=\"strap-blue\">\r\n        </div>\r\n        <div class=\"strap-white\">\r\n        </div>\r\n        <div class=\"strap-red\">\r\n        </div>\r\n    </div>\r\n</div>");
$templateCache.put("positioning/output/output.html","<div class=\"row\">\r\n   <div class=\"col-md-3\">\r\n      <label for=\"geoprocessOutputFormat\">\r\n					Output Format<mandatory />\r\n				</label>\r\n   </div>\r\n   <div class=\"col-md-9\">\r\n      <select id=\"geoprocessOutputFormat\" style=\"width:95%\" ng-model=\"state.outFormat\" ng-options=\"opt.value for opt in settings.processing.outFormat\"></select>\r\n   </div>\r\n</div>");
$templateCache.put("positioning/progress/progress.html","<div class=\"row\">\r\n      <div class=\"col-md-4\" style=\"padding-top:7px\">\r\n         <div class=\"progress\">\r\n            <div class=\"progress-bar\" role=\"progressbar\" aria-valuenow=\"{{state.percentage}}\"\r\n                     aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: {{state.percentage}}%;\">\r\n                <span class=\"sr-only\"></span>\r\n            </div>\r\n         </div>\r\n      </div>\r\n      <div class=\"col-md-5\" style=\"padding-top:7px\">\r\n         <span style=\"padding-right:10px\" uib-tooltip=\"Add information about your file.\" tooltip-placement=\"left\">\r\n            <i class=\"fa fa-file-text-o fa-lg\" ng-class=\"{\'ed-valid\': state.validFileInfo, \'ed-invalid\': !state.validFileInfo}\"></i>\r\n         </span>\r\n         <span style=\"padding-right:10px\" uib-tooltip=\"Select a valid download format.\" tooltip-placement=\"left\">\r\n            <i class=\"fa fa-files-o fa-lg\" ng-class=\"{\'ed-valid\': state.validOutFormat, \'ed-invalid\': !state.validOutFormat}\"></i>\r\n         </span>\r\n         <span style=\"padding-right:10px\" uib-tooltip=\"Provide a file name for your reprojected data.\" tooltip-placement=\"left\">\r\n            <span class=\"fa-stack\" ng-class=\"{\'ed-valid\': state.validFilename, \'ed-invalid\': !state.validFilename}\">\r\n               <i class=\"fa fa-file-o fa-lg fa-stack-1x\"></i>\r\n               <i class=\"fa fa-terminal fa-stack-1x\" style=\"font-size:80%\"></i>\r\n            </span>\r\n         </span>\r\n         <span style=\"padding-right:10px\" uib-tooltip=\"Provide an email address.\" tooltip-placement=\"left\">\r\n            <i class=\"fa fa-envelope fa-lg\" ng-class=\"{\'ed-valid\': state.validEmail, \'ed-invalid\': !state.validEmail}\"></i>\r\n         </span>\r\n      </div>\r\n      <div class=\"col-md-3\">\r\n         <button type=\"button\" class=\"btn btn-primary\" ng-click=\"cancel()\">Cancel</button>\r\n         <button class=\"btn btn-primary pull-right\" ng-disabled=\"!state.validForm\" ng-click=\"submit()\" disabled=\"disabled\">Submit</button>\r\n      </div>\r\n\r\n   </div>");}]);