{
   angular.module("product.download", [])

      .directive("productDownloadButton", ['configService', function (configService) {
         return {
            template: "<button ng-click='item.showDownload = !item.showDownload' type='button' class='undecorated' title='Click to start download'>" +
            "<i class='fa fa-lg fa-download' ng-class='{active:item.showDownload}'></i></button>",
            scope: {
               item: "="
            },
            link: function (scope, element, attrs) {
               console.log("What's up item!");
            }
         };
      }])

      .directive("productDownloadPanel", ['$rootScope', 'productDownloadService', 'flashService',
         function ($rootScope, productDownloadService, flashService) {
            return {
               templateUrl: "icsm/products/download.html",
               scope: {
                  item: "="
               },
               link: function (scope, element, attrs) {
                  let clipMessage;

                  scope.processing = {
                     clip: {},

                     get valid() {
                        return this.validClipSize && this.validEmail;
                     },

                     get validClip() {
                        return validClip(this.clip);
                     },

                     get validClipSize() {
                        return validClip(this.clip) && validSize(this.clip, scope.item.restrictSize);
                     },

                     get validEmail() {
                        return this.email;
                     },

                     get validProjection() {
                        return this.outCoordSys;
                     },

                     get validFormat() {
                        return this.outFormat;
                     },

                     get percentComplete() {
                        return (this.validClip ? 25 : 0) + (this.validEmail ? 25 : 0) +
                           (this.validProjection ? 25 : 0) + (this.validFormat ? 25 : 0);
                     }
                  };

                  scope.item.processing = scope.processing;

                  scope.drawn = function () {
                     return draw();
                  };

                  $rootScope.$on('icsm.clip.drawn', (event, clip) => {
                     scope.processing.clip = {
                        xMax: clip.xMax,
                        xMin: clip.xMin,
                        yMax: clip.yMax,
                        yMin: clip.yMin
                     };
                     scope.processing.message = "";
                     if (!scope.processing.validClip) {
                        scope.processing.message = "That is not a valid area for this dataset";
                     } else {
                        if (constrainBounds(scope.processing.clip, scope.item.bounds)) {
                           scope.processing.message = "Bounds restricted to fit within product's extent";
                        }

                        if (!validSize(scope.processing.clip, scope.item.restrictSize)) {
                           scope.processing.message = "That exceeds the area you can clip for this dataset. Restrict to " +
                              scope.item.restrictSize + " square degrees.";
                        }
                     }
                  });

                  scope.$watch('item.showDownload', function (value, oldValue) {
                     if (value && !scope.processing.email) {
                        productDownloadService.getEmail().then(email => {
                           scope.processing.email = email;
                        });
                     }
                  });
               }
            };
         }])

      .directive("productDownloadSubmit", ['configService', 'productDownloadService', 'messageService', function (configService, productDownloadService, messageService) {
         return {
            templateUrl: "icsm/products/submit.html",
            scope: {
               item: "=",
               processing: "="
            },
            link: function (scope, element, attrs) {
               scope.submit = function () {
                  let processing = scope.processing;

                  productDownloadService.setEmail(processing.email);

                  // Assemble data
                  productDownloadService.submit(scope.item.template,
                     {
                        id: scope.item.primaryId,
                        yMin: processing.clip.yMin,
                        yMax: processing.clip.yMax,
                        xMin: processing.clip.xMin,
                        xMax: processing.clip.xMax,
                        outFormat: processing.outFormat.code,
                        outCoordSys: processing.outCoordSys.code,
                        email: processing.email,
                        filename: ""
                     });
                  messageService.success("Submitted your job. An email will be delivered on completion.");
               };
            }
         };
      }])

      .factory("productDownloadService", DownloadService);

   function validClip(clip) {
      let valid = isFinite(clip.yMax) && isFinite(clip.xMax) && isFinite(clip.yMin) && isFinite(clip.xMin);
      valid = valid && clip.yMax < 90 && clip.yMin > -90 && clip.xMax <= 180 && clip.xMin >= -180;
      valid = valid && clip.yMax > clip.yMin && clip.xMax > clip.xMin;
      return valid;
   }

   DownloadService.$invoke = ['productsMapUtilsService', 'persistService'];
   function DownloadService(productsMapUtilsService, persistService) {
      let key = "download_email";
      let CLIPOPTIONS = {
         weight: 2,
         opacity: 0.9,
         fill: false,
         color: "#000000",
         width: 3,
         clickable: false
      };

      return {

         showClip: function (clip) {
            this.removeClip(clip.layer);

            let bounds = [
               [clip.yMin, clip.xMin],
               [clip.yMax, clip.xMax]
            ];

            clip.layer = productsMapUtilsService.createBounds(bounds, CLIPOPTIONS);
            productsMapUtilsService.showLayer(clip.layer);
         },

         removeClip: function (layer) {
            if (layer) {
               productsMapUtilsService.hideLayer(layer);
            }
         },


         setEmail: function (email) {
            persistService.setItem(key, email);
         },

         getEmail: function () {
            return persistService.getItem(key).then(function (value) {
               return value;
            });
         },
         // https://elvis2018-ga.fmecloud.com/fmejobsubmitter/fsdf_elvis_prod/DEMClipZipShip_Master_S3Source.fmw?geocat_number=${id}&out_grid_name=${filename}&input_coord_sys=LL-WGS84&ymin=${yMin}&ymax=${yMax}&xmin=${xMin}&xmax=${xMax}&output_format=${outFormat}&out_coord_sys=${outCoordSys}&email_address=${email}&opt_showresult=false&opt_servicemode=async
         submit: function (template, parameters) {
            let workingString = template;

            angular.forEach(parameters, function (item, key) {
               workingString = workingString.replace("${" + key + "}", item);
            });

            $("#launcher")[0].src = workingString;
         }
      };
   }



   // The input validator takes care of order and min/max constraints. We just check valid existance.
   function validSize(clip, size = 16) {
      return clip &&
         angular.isNumber(clip.xMax) &&
         angular.isNumber(clip.xMin) &&
         angular.isNumber(clip.yMax) &&
         angular.isNumber(clip.yMin) &&
         !overSizeLimit(clip, size) &&
         !underSizeLimit(clip);
   }

   function underSizeLimit(clip) {
      let size = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);
      return size < 0.00000000001 || clip.xMax < clip.xMin;
   }

   function overSizeLimit(clip, size) {
      // Shouldn't need abs but it doesn't hurt.
      let actual = Math.abs((clip.xMax - clip.xMin) * (clip.yMax - clip.yMin));
      return size && actual > size;
   }

   function constrainBounds(c, p) {
      let flag = false,
         ret = false;

      // Have we read the parameters yet?
      if (!p || empty(c.xMax) || empty(c.xMin) || empty(c.yMax) || empty(c.yMin)) {
         return false;
      }

      ret = flag = +c.xMax < +p.xMin;
      if (flag) {
         c.xMax = +p.xMin;
      }

      flag = +c.xMax > +p.xMax;
      ret = ret || flag;

      if (flag) {
         c.xMax = +p.xMax;
      }

      flag = +c.xMin < +p.xMin;
      ret = ret || flag;
      if (flag) {
         c.xMin = +p.xMin;
      }

      flag = +c.xMin > +c.xMax;
      ret = ret || flag;
      if (flag) {
         c.xMin = c.xMax;
      }

      // Now for the Y's
      flag = +c.yMax < +p.yMin;
      ret = ret || flag;
      if (flag) {
         c.yMax = +p.yMin;
      }

      flag = +c.yMax > +p.yMax;
      ret = ret || flag;
      if (flag) {
         c.yMax = +p.yMax;
      }

      flag = +c.yMin < +p.yMin;
      ret = ret || flag;
      if (flag) {
         c.yMin = +p.yMin;
      }

      flag = +c.yMin > +c.yMax;
      ret = ret || flag;
      if (flag) {
         c.yMin = +c.yMax;
      }

      return ret;

      function empty(val) {
         return angular.isUndefined(val) ||
            val === "" ||
            val === null;
      }
   }


}
