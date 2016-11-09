"use strict";!function(t){function e(t,e,n){var r=this;n.getMap().then(function(t){r.map=t}),e.getConfig().then(function(t){r.data=t;try{var e=document.createElement("canvas");t.modern=!(!window.WebGLRenderingContext||!e.getContext("webgl")&&!e.getContext("experimental-webgl"))}catch(n){t.modern=!1}})}t.module("WaterApp",["common.altthemes","common.baselayer.control","common.basin","common.bbox","common.catchment","common.cc","common.clip","common.download","common.extent","common.header","common.iso19115","common.metaview","common.navigation","common.recursionhelper","common.storage","common.templates","common.tile","common.wms","explorer.config","explorer.confirm","explorer.drag","explorer.enter","explorer.flasher","explorer.googleanalytics","explorer.httpdata","explorer.info","explorer.legend","explorer.message","explorer.modal","explorer.projects","explorer.tabs","explorer.version","exp.search.geosearch","exp.search.searches","exp.search.lastsearch","exp.search.templates","exp.search.map.service","exp.ui.templates","explorer.map.templates","ui.bootstrap","ui.bootstrap-slider","ngAutocomplete","ngRoute","ngSanitize","page.footer","geo.draw","geo.map","geo.maphelper","geo.measure","water.panes","water.templates","water.toolbar","water.select","water.vector","water.vector.download","water.vector.geoprocess"]).config(["configServiceProvider","projectsServiceProvider","versionServiceProvider","lastSearchServiceProvider",function(t,e,n,r){r.noListen(),t.location("icsm/resources/config/water.json"),t.dynamicLocation("icsm/resources/config/appConfig.json?t="),n.url("icsm/assets/package.json"),e.setProject("icsm")}]).config(["$routeProvider",function(t){t.when("/administrativeBoundaries",{templateUrl:"admin/app/app.html",controller:"adminCtrl",controllerAs:"admin"}).when("/positioning",{templateUrl:"positioning/app/app.html",controller:"positioningCtrl",controllerAs:"positioning"}).when("/placeNames",{templateUrl:"placenames/app/app.html",controller:"placeNamesCtrl",controllerAs:"placeNames"}).when("/landParcelAndProperty",{templateUrl:"landParcelAndProperty/app/app.html",controller:"landParcelAndPropertyCtrl",controllerAs:"landParcelAndProperty"}).when("/imagery",{templateUrl:"imagery/app/app.html",controller:"imageryCtrl",controllerAs:"imagery"}).when("/transport",{templateUrl:"transport/app/app.html",controller:"transportCtrl",controllerAs:"transport"}).when("/water",{templateUrl:"water/app/app.html",controller:"waterCtrl",controllerAs:"water"}).when("/elevationAndDepth",{templateUrl:"elevationAndDepth/app/app.html",controller:"elevationAndDepthCtrl",controllerAs:"elevationAndDepth"}).when("/landCover",{templateUrl:"landCover/app/app.html",controller:"landCoverCtrl",controllerAs:"landCover"}).when("/icsm",{templateUrl:"icsm/app/app.html",controller:"icsmCtrl",controllerAs:"icsm"}).otherwise({redirectTo:"/icsm"})}]).factory("userService",[function(){function t(){return!0}return{login:t,hasAcceptedTerms:t,setAcceptedTerms:t,getUsername:function(){return"anon"}}}]).controller("RootCtrl",e),e.$invoke=["$http","configService","mapService"]}(angular),function(t){function e(t,e,r,o,a,i){function s(){o(function(){v._executeQuery()},100)}var l,c="Search Layers",d="icsm/resources/config/water_select.json",u={text:"",daterange:{enabled:!1,upper:null,lower:null},bbox:{fromMap:!0,intersects:!0,yMax:null,yMin:null,xMax:null,xMin:null},defaultKeywords:[],keywords:[]},p={},m="#ff7800",h="darkblue",v={getSelectCriteria:function(){return u},getLayerGroup:function(){return l||(l=a.getGroup(c)),l},setKeywords:function(t){},setFilter:function(t){},refresh:function(){},getDaterange:function(){return u.daterange},more:function(){},_executeQuery:function(){t.get(d,{cache:!0}).then(function(t){v.getLayerGroup();var e=t.data;e.response.docs.forEach(function(t){v._decorateDataset(t),"group"==t.type&&t.docs.forEach(function(t){v._decorateDataset(t)})}),r.$broadcast("select.facet.counts",e),r.$broadcast("select.results.received",e)})},createLayer:function(t,e){var n,r,o,a=t.bbox,i=t.primaryId;if(o=p[i],!o){if(!a)return null;if(n=a.split(" "),4!=n.length)return null;e||(e=m),r=[[+n[1],+n[0]],[+n[3],+n[2]]],o=L.rectangle(r,{fill:!1,color:"#000000",width:3,clickable:!1}),p[i]=o}return this._decorateDataset(t),l.addLayer(o),o},_decorateDataset:function(t){function e(t){var e;return t?(e=t.split(/\s/g),{xMin:+e[0],xMax:+e[2],yMax:+e[3],yMin:+e[1]}):null}var r=p[t.primaryId];r?(t.layer=r,t.showLayer=!0):(t.layer=null,t.showLayer=!1,t.services=n(t.dcUris),t.bounds=e(t.bbox))},showWithin:function(t){function e(t,e,n,r){var o=u.bbox;return t>o.xMin&&n<o.xMax&&e>o.yMin&&r<o.yMax}t.forEach(function(t){var n,r=t.bbox;r?(n=r.split(" "),4==n.length&&e(+n[0],+n[1],+n[2],+n[3])?v.createLayer(t):v.removeLayer(t)):v.removeLayer(t)})},toggle:function(t){t.showLayer?this.removeLayer(t):this.createLayer(t)},toggleAll:function(t){var e=this,n=t.some(function(t){return!t.showLayer});return t.forEach(function(t){n?t.showLayer||e.createLayer(t):t.showLayer&&e.removeLayer(t)}),!n},hideAll:function(t){t.forEach(function(t){t.showLayer&&v.removeLayer(t)})},hilight:function(t){t.setStyle({color:h})},lolight:function(t){t.setStyle({color:m})},removeLayer:function(t){var e=t.primaryId,n=p[e];n&&(l.removeLayer(n),delete p[e]),this._decorateDataset(t)}};return s(),v}function n(t){function e(t){this.uris=t,this.container={wcs:null,wms:null},t?this.services=t.map(function(t){var e=new n(t);return this.container.wcs=e.isWcs()?e:this.container.wcs,this.container.wms=e.isWms()?e:this.container.wms,e}.bind(this)):this.services=[],this.hasWcs=function(){return null!==this.container.wcs},this.hasWms=function(){return null!==this.container.wms},this.getWcs=function(){return this.container.wcs},this.getWms=function(){return this.container.wms},this.remove=function(){this.services.forEach(function(t){t.remove()})}}function n(t){var e=$(t);this.protocol=e.attr("protocol"),this.url=e.text(),this.layerNames=e.attr("layerNames"),this.name=e.attr("name"),this.description=e.attr("description"),this.handlers=[],this.isWcs=function(){return this.protocol==r.WCS},this.isWfs=function(){return this.protocol==r.WFS},this.isWms=function(){return this.protocol==r.WMS},this.isSupported=function(){return"undefined"==typeof r[this.protocol]},this.addHandler=function(t){this.handlers.push(t)},this.removeHandler=function(t){this.handlers.push(t)},this.remove=function(){this.handlers.forEach(function(t){this.callback.remove&&t.remove(this)}.bind(this)),this.handlers=[]}}var r={WCS:"OGC:WCS",WFS:"OGC:WFS",WMS:"OGC:WMS"};return new e(t)}t.module("water.select.service",[]).factory("selectService",e),e.$inject=["$http","$q","$rootScope","$timeout","mapService","configService"]}(angular),function(t){function e(t){this.criteria=t.getSelectCriteria(),this.refresh=function(){t.refresh()}}function n(t,e,n,r){var o,a=this;t.$on("select.results.received",function(t,e){n.remove(o),a.data=e}),e.getConfig("facets").then(function(t){this.hasKeywords=t&&t.keywordMapped&&t.keywordMapped.length>0}.bind(this)),this.select=function(){n.remove(o),o=n.add("Selecting",3e3,!0),r.setFilter(this.filter)},this.toggle=function(t){r.toggle(t)},this.toggleAll=function(){r.toggleAll(this.data.response.docs)},this.showWithin=function(){r.showWithin(this.data.response.docs)},this.allShowing=function(){return!(!this.data||!this.data.response)&&!this.data.response.docs.some(function(t){return!t.showLayer})},this.anyShowing=function(){return!(!this.data||!this.data.response)&&this.data.response.docs.some(function(t){return t.showLayer})},this.hideAll=function(){r.hideAll(this.data.response.docs)},this.hilight=function(t){t.layer&&r.hilight(t.layer)},this.lolight=function(t){t.layer&&r.lolight(t.layer)}}t.module("water.select",["water.select.service"]).controller("SelectCtrl",n).controller("SelectCriteriaCtrl",e).directive("waterSelect",[function(){return{templateUrl:"water/select/select.html",link:function(t,e,n){console.log("Hello select!")}}}]).directive("selectDoc",[function(){return{templateUrl:"water/select/doc.html",link:function(t,e,n){console.log("What's up doc!")}}}]).directive("selectGroup",[function(){return{templateUrl:"water/select/group.html",scope:{group:"="},link:function(t,e,n){console.log("What's up doc!")}}}]).filter("pubDate",function(){return function(t){var e;return t?(e=new Date(t),e.getDate()+"/"+(e.getMonth()+1)+"/"+e.getFullYear()):"-"}}).filter("authors",function(){return function(t){return t?t.join(", "):"-"}}).filter("truncate",function(){return function(t,e){return t&&t.length>e-3?t.substr(0,e-3)+"...":t}}),e.$inject=["selectService"],n.$inject=["$rootScope","configService","flashService","selectService"]}(angular),function(t){function e(t){t.data().then(function(t){this.data=t}.bind(this))}function n(){return{add:function(t){},remove:function(t){}}}t.module("water.panes",[]).directive("icsmPanes",["$rootScope","$timeout","mapService",function(t,e,n){return{templateUrl:"water/panes/panes.html",transclude:!0,scope:{defaultItem:"@",data:"="},controller:["$scope",function(r){var o=!1;r.view=r.defaultItem,r.setView=function(e){var a=r.view;r.view==e?(e&&(o=!0),r.view=""):(e||(o=!0),r.view=e),t.$broadcast("view.changed",r.view,a),o&&n.getMap().then(function(t){t._onResize()})},e(function(){t.$broadcast("view.changed",r.view,null)},50)}]}}]).directive("icsmTabs",[function(){return{templateUrl:"water/panes/tabs.html",require:"^icsmPanes"}}]).controller("PaneCtrl",e).factory("paneService",n),e.$inject=["paneService"],n.$inject=[]}(angular),function(t){t.module("water.toolbar",[]).directive("icsmToolbar",[function(){return{controller:"toolbarLinksCtrl"}}]).directive("icsmToolbarRow",[function(){return{scope:{map:"="},restrict:"AE",templateUrl:"water/toolbar/toolbar.html"}}]).controller("toolbarLinksCtrl",["$scope","configService",function(t,e){var n=this;e.getConfig().then(function(t){n.links=t.toolbarLinks}),t.item="",t.toggleItem=function(e){t.item=t.item===e?"":e}}])}(angular),function(t,e){function n(n,r,o,a,i,s,l,c,d){function u(t){return p}var p,m,h=null;return d.config().then(function(t){p=t.serviceUrlTemplate}),l.getMap().then(function(t){m=t}),{queryLayer:function(t,n){var o=r.defer(),a=e.esri.featureLayer({url:t.url}),i=e.latLngBounds([n.yMin,n.xMin],[n.yMax,n.xMax]);return a.query().intersects(i).ids(function(t,e){t?o.reject(t):o.resolve(e)}),o.promise},outFormats:function(){return d.outFormats()},handleShowClip:function(t){this.removeClip(),h=e.rectangle([[t.yMin,t.xMin],[t.yMax,t.xMax]],{weight:2,opacity:.9,fill:!1,color:"#000000",width:3,clickable:!1}),h.addTo(m)},removeClip:function(){h&&(m.removeLayer(h),h=null)},addLayer:function(t){return e.tileLayer.wms(t.parameters[0],t.parameters[1]).addTo(m)},removeLayer:function(t){m.removeLayer(t)},initiateJob:function(e,n){var r=u(e),o=e.processing,a={bbox:{yMin:o.clip.yMin,yMax:o.clip.yMax,xMin:o.clip.xMin,xMax:o.clip.xMax},geocatId:e.primaryId,crs:o.outCoordSys.code,format:o.outFormat.code},l=[],c=[];e.docs.forEach(function(t){t.selected&&(l.push(t.primaryId),c.push(t.code))}),t.forEach({geocat_number:l.join(" "),features_selected:c.join(" "),ymin:o.clip.yMin,ymax:o.clip.yMax,xmin:o.clip.xMin,xmax:o.clip.xMax,file_name:o.filename?o.filename:"",file_format_vector:o.outFormat.code,file_format_raster:"",coord_sys:o.outCoordSys.code,email_address:n},function(t,e){r=r.replace("{"+e+"}",t)}),$("#launcher")[0].src=r,i.setEmail(n),s("send","event","nedf","click","FME data export: "+JSON.stringify(a))},getConfig:function(){return d.config()}}}t.module("water.vector.geoprocess",[]).directive("vectorGeoprocess",["$http","$q","$timeout","vectorGeoprocessService","flashService","messageService","vectorService",function(e,n,r,o,a,i,s){return{restrict:"AE",templateUrl:"water/vector/geoprocess.html",scope:{data:"="},link:function(e){function l(){c(),e.data.referenceLayer&&(f=o.addLayer(e.data.referenceLayer))}function c(){f&&o.removeLayer(f)}function d(t){var e=(t.xMax-t.xMin)*(t.yMax-t.yMin);return e<1e-11||t.xMax<t.xMin}function u(t){var n=Math.abs((t.xMax-t.xMin)*(t.yMax-t.yMin));return e.data.restrictSize&&n>e.data.restrictSize}function p(e,n){function r(e){return t.isUndefined(e)||""===e||null===e}var o=!1,a=!1;return!(!n||r(e.xMax)||r(e.xMin)||r(e.yMax)||r(e.yMin))&&(a=o=+e.xMax<+n.xMin,o&&(e.xMax=+n.xMin),o=+e.xMax>+n.xMax,a=a||o,o&&(e.xMax=+n.xMax),o=+e.xMin<+n.xMin,a=a||o,o&&(e.xMin=+n.xMin),o=+e.xMin>+e.xMax,a=a||o,o&&(e.xMin=e.xMax),o=+e.yMax<+n.yMin,a=a||o,o&&(e.yMax=+n.yMin),o=+e.yMax>+n.yMax,a=a||o,o&&(e.yMax=+n.yMax),o=+e.yMin<+n.yMin,a=a||o,o&&(e.yMin=+n.yMin),o=+e.yMin>+e.yMax,a=a||o,o&&(e.yMin=+e.yMax),a)}function m(t){t.xMax=null===t.xMax?null:+t.xMax,t.xMin=null===t.xMin?null:+t.xMin,t.yMax=null===t.yMax?null:+t.yMax,t.yMin=null===t.yMin?null:+t.yMin}function h(e){return e&&t.isNumber(e.xMax)&&t.isNumber(e.xMin)&&t.isNumber(e.yMax)&&t.isNumber(e.yMin)&&!u(e)&&!d(e)}var v,g,f;s.outFormats().then(function(t){e.outFormats=t}),e.$watch("data",function(t,n){n&&(o.removeClip(),c()),t&&t!=n&&(e.stage="bbox",l())}),e.$watchGroup(["data.processing.clip.xMax","data.processing.clip.xMin","data.processing.clip.yMax","data.processing.clip.yMin"],function(t,e,s){function c(){var t=n.defer();if(d=s.drawn(),d&&d.code)switch(d.code){case"oversize":r(function(){a.remove(v),i.error("The selected area is too large to process. Please restrict to approximately "+Math.sqrt(s.data.restrictSize)+" degrees square."),s.stage="bbox",l(),t.resolve(d)});break;case"undersize":r(function(){a.remove(v),i.error("X Min and Y Min should be smaller than X Max and Y Max, respectively. Please update the drawn area."),s.stage="bbox",l(),t.resolve(d)});break;default:return n.when(d)}return t.promise}var d,u;g&&(r.cancel(g),g=null),s.data&&s.data.processing&&s.data.processing.clip&&null!==s.data.processing.clip.xMax&&(v=a.add("Validating selected area...",3e3),s.checkingOrFailed=!!u,g=r(function(){c().then(function(t){try{t&&"success"==t.code&&(o.handleShowClip(s.data.processing.clip),s.checkingOrFailed=!1)}catch(e){s.checkingOrFailed=!1}})},2e3))}),e.drawn=function(){return o.removeClip(),m(e.data.processing.clip),p(e.data.processing.clip,e.data.bounds)&&(v=a.add("Redrawn to fit within data extent",5e3)),u(e.data.processing.clip)?{code:"oversize"}:d(e.data.processing.clip)?{code:"undersize"}:null===e.data.processing.clip.xMax?{code:"incomplete"}:h(e.data.processing.clip)?{code:"success"}:{code:"invalid"}},e.startExtract=function(){e.allDataSet()&&(i.info("Your request has been sent for processing. You will be notified by email on completion of the job."),a.add("You can select another area for processing.",1e4),o.initiateJob(e.data,e.email),e.data.download=!1)},e.allDataSet=function(){var t=e.data&&e.data.processing?e.data.processing:null;return t&&e.email&&h(t.clip)&&t.outCoordSys&&t.outFormat},e.validSansEmail=function(){var t=e.data&&e.data.processing?e.data.processing:null;return t&&h(t.clip)&&t.outCoordSys&&t.outFormat},e.validClip=function(t){return t&&t.processing&&h(t.processing.clip)},o.getConfig().then(function(t){e.config=t})}}}]).factory("vectorGeoprocessService",n).filter("sysIntersect",function(){return function(e,n){return n&&t.isNumber(n.xMin)&&t.isNumber(n.xMax)&&t.isNumber(n.yMin)&&t.isNumber(n.yMax)?e.filter(function(t){return!t.extent||t.extent.xMin<=n.xMin&&t.extent.xMax>=n.xMax&&t.extent.yMin<=n.yMin&&t.extent.yMax>=n.yMax}):e}}),n.$invoke=["$http","$q","$timeout","configService","downloadService","ga","mapService","storageService","vectorService"]}(angular,L),function(t){t.module("water.vector",[]).directive("vectorSelect",[function(){return{templateUrl:"water/vector/vector.html",controllerAs:"vect",controller:"VectorCtrl"}}]).controller("VectorCtrl",["selectService","vectorService",function(t,e){var n=this;e.config().then(function(t){n.config=t,n.group=t.group}),this.hilight=function(e){e.layer&&t.hilight(e.layer)},this.lolight=function(e){e.layer&&t.lolight(e.layer)}}]).factory("vectorService",["$http","$q",function(t,e){var n,r,o={};return o.config=function(){if(r)return e.when(r);var o=e.defer();return n?n.push(o):(n=[o],t.get("icsm/resources/config/water_vector.json",{cache:!0}).then(function(t){r=t.data,n.forEach(function(t){t.resolve(r)})})),o.promise},o.outFormats=function(){return o.config().then(function(t){return t.refData.vectorFileFormat})},o}])}(angular),function(t,e){function n(t){var e=this;t.data().then(function(t){e.data=t}),this.remove=function(){t.clear()},this.changeEmail=function(e){t.setEmail(e)}}function r(t,e,n,r,o){var a="download_email",i="Download Layers",s={zoom:null,center:null,layer:null},l={email:null,item:null},c={getLayerGroup:function(){return r.getGroup(i)},setState:function(t){function e(){var e=[[t.bounds.yMin,t.bounds.xMin],[t.bounds.yMax,t.bounds.xMax]];s.layer&&r.getGroup(i).removeLayer(s.layer),t.queryLayer||(s.layer=L.rectangle(e,{color:"black",fill:!1}),r.getGroup(i).addLayer(s.layer))}function n(t){r.clearGroup(i),s.layer=null}t?e():n(map)},add:function(t){this.clear(),l.item=t,l.item.download=!0,t.processsing||(t.processing={clip:{xMax:null,xMin:null,yMax:null,yMin:null}})},clear:function(){l.item&&(l.item.download=!1,l.item=null)},setEmail:function(t){o.setItem(a,t)},getEmail:function(){return o.getItem(a).then(function(t){return l.email=t,t})},data:function(){return e.when(l)}};return c}t.module("water.vector.download",["common.geoprocess"]).directive("vectorPopup",["vectorDownloadService",function(t){return{restrict:"AE",templateUrl:"water/vector/popup.html",link:function(e){t.data().then(function(n){e.data=n,e.$watch("data.item",function(n,r){n&&(e.stage="bbox"),(n||r)&&t.setState(n)})})}}}]).directive("vectorDownload",["vectorDdownloadService",function(t){return{restrict:"AE",controller:"VectorDownloadCtrl",templateUrl:"water/vector/popup.html",link:function(){console.log("What the download...")}}}]).directive("commonVectorDownload",["vectorDownloadService",function(t){return{templateUrl:"water/vector/download.html",controller:"VectorDownloadCtrl",link:function(e,n){t.data().then(function(t){e.data=t}),e.$watch("data.item",function(e,n){(e||n)&&t.setState(e)})}}}]).directive("vectorAdd",["$rootScope","vectorDownloadService","flashService",function(t,e,n){return{templateUrl:"water/vector/add.html",restrict:"AE",scope:{group:"="},link:function(r,o){r.toggle=function(){r.group.download?e.clear(r.group):(n.add("Select an area of interest that intersects the highlighted areas."),e.add(r.group),r.group.sysId&&t.$broadcast("hide.wms",r.group.sysId))},r.someSelected=function(){if(!r.group||!r.group.docs)return!1;var t=r.group.docs.some(function(t){return t.selected});return t}}}}]).controller("VectorDownloadCtrl",n).factory("vectorDownloadService",r),n.$inject=["vectorDownloadService"],r.$inject=["$http","$q","$rootScope","mapService","storageService"]}(angular,$),angular.module("water.templates",[]).run(["$templateCache",function(t){t.put("water/select/doc.html",'<div ng-class-odd="\'odd\'" ng-class-even="\'even\'" ng-mouseleave="select.lolight(doc)" ng-mouseenter="select.hilight(doc)">\r\n\t<span ng-class="{ellipsis:!expanded}" tooltip-enable="!expanded" style="width:100%;display:inline-block;"\r\n\t\t\ttooltip-class="selectAbstractTooltip" tooltip="{{doc.abstract | truncate : 250}}" tooltip-placement="bottom">\r\n\t\t<button type="button" class="undecorated" ng-click="expanded = !expanded" title="Click to see more about this dataset">\r\n\t\t\t<i class="fa pad-right fa-lg" ng-class="{\'fa-caret-down\':expanded,\'fa-caret-right\':(!expanded)}"></i>\r\n\t\t</button>\r\n\t\t<download-add item="doc" group="group"></download-add>\r\n\t\t<common-wms data="doc"></common-wms>\r\n\t\t<common-bbox data="doc" ng-if="doc.showExtent"></common-bbox>\r\n\t\t<common-cc></common-cc>\r\n\t\t<common-metaview url="\'http://www.ga.gov.au/metadata-gateway/metadata/record/\' + doc.sysId + \'/xml\'" container="select" item="doc"></common-metaview>\r\n\t\t<a href="http://www.ga.gov.au/metadata-gateway/metadata/record/{{doc.sysId}}" target="_blank" ><strong>{{doc.title}}</strong></a>\r\n\t</span>\r\n\t<span ng-class="{ellipsis:!expanded}" style="width:100%;display:inline-block;padding-right:15px;">\r\n\t\t{{doc.abstract}}\r\n\t</span>\r\n\t<div ng-show="expanded" style="padding-bottom: 5px;">\r\n\t\t<h5>Keywords</h5>\r\n\t\t<div>\r\n\t\t\t<span class="badge" ng-repeat="keyword in doc.keywords track by $index">{{keyword}}</span>\r\n\t\t</div>\r\n\t</div>\r\n</div>'),t.put("water/select/group.html",'<div class="panel panel-default" style="margin-bottom:-5px;" >\r\n\t<div class="panel-heading"><common-wms data="group"></common-wms> <strong>{{group.title}}</strong></div>\r\n\t<div class="panel-body">\r\n   \t\t<div ng-repeat="doc in group.docs">\r\n   \t\t\t<div select-doc doc="doc" group="group"></div>\r\n\t\t</div>\r\n\t</div>\r\n</div>\r\n'),t.put("water/select/select.html",'<div ng-controller="SelectCtrl as select">\r\n\t<div style="position:relative;padding:5px;padding-left:10px;" class="scrollPanel" ng-if="!select.selected">\r\n\t\t<div class="panel panel-default" style="margin-bottom:-5px">\r\n  \t\t\t<div class="panel-heading">\r\n  \t\t\t\t<h3 class="panel-title">Available datasets</h3>\r\n  \t\t\t</div>\r\n  \t\t\t<div class="panel-body">\r\n\t\t\t\t<div ng-repeat="doc in select.data.response.docs" style="padding-bottom:7px">\r\n\t\t\t\t\t<div select-doc ng-if="doc.type == \'dataset\'" doc="doc"></div>\r\n\t\t\t\t\t<select-group ng-if="doc.type == \'group\'" group="doc"></select-group>\r\n\t\t\t\t</div>\r\n\t\t\t\t<div vector-select></div>\r\n  \t\t\t</div>\r\n\t\t</div>\r\n\t</div>\r\n\t<div style="position:relative;padding:5px;padding-left:10px;" class="scrollPanel" ng-if="select.selected" common-item-metaview container="select"></div>\r\n</div>'),t.put("water/panes/panes.html",'<div class="container contentContainer">\r\n\t<div class="row icsmPanesRow" >\r\n\t\t<div class="icsmPanesCol" ng-class="{\'col-md-12\':!view, \'col-md-7\':view}" style="padding-right:0">\r\n\t\t\t<div class="expToolbar row noPrint" icsm-toolbar-row map="root.map" ></div>\r\n\t\t\t<div class="panesMapContainer" geo-map configuration="data.map">\r\n\t\t\t    <geo-extent></geo-extent>\r\n\t\t\t</div>\r\n    \t\t<div geo-draw data="data.map.drawOptions" line-event="elevation.plot.data" rectangle-event="bounds.drawn"></div>\r\n    \t\t<div icsm-tabs class="icsmTabs"  ng-class="{\'icsmTabsClosed\':!view, \'icsmTabsOpen\':view}"></div>\r\n\t\t</div>\r\n\t\t<div class="icsmPanesColRight" ng-class="{\'hidden\':!view, \'col-md-5\':view}" style="padding-left:0; padding-right:0">\r\n\t\t\t<div class="panesTabContentItem" ng-show="view == \'datasets\'" water-select></div>\r\n\t\t\t<div class="panesTabContentItem" ng-show="view == \'glossary\'" water-glossary></div>\r\n\t\t\t<div class="panesTabContentItem" ng-show="view == \'help\'" water-help></div>\r\n\t\t</div>\r\n\t</div>\r\n</div>'),t.put("water/panes/tabs.html",'<!-- tabs go here -->\r\n<div id="panesTabsContainer" class="paneRotateTabs" style="opacity:0.9" ng-style="{\'right\' : contentLeft +\'px\'}">\r\n\r\n\t<div class="paneTabItem" ng-class="{\'bold\': view == \'datasets\'}" ng-click="setView(\'datasets\')">\r\n\t\t<button class="undecorated">Datasets</button>\r\n\t</div>\r\n\t<div class="paneTabItem" ng-class="{\'bold\': view == \'glossary\'}" ng-click="setView(\'glossary\')">\r\n\t\t<button class="undecorated">Glossary</button>\r\n\t</div>\r\n\t<div class="paneTabItem" ng-class="{\'bold\': view == \'help\'}" ng-click="setView(\'help\')">\r\n\t\t<button class="undecorated">Help</button>\r\n\t</div>\r\n</div>\r\n'),t.put("water/toolbar/toolbar.html",'<div icsm-toolbar>\r\n\t<div class="row toolBarGroup">\r\n\t\t<search-searches name="toolbar">\r\n\t\t\t<search-search label="Google search" default="true">\r\n\t\t\t\t<div geo-search></div>\r\n\t\t\t</search-search>\r\n\t\t\t<search-search label="Basins search">\r\n\t\t\t\t<common-basin-search class="cossapSearch"></common-basin-search>\r\n\t\t\t</search-search>\r\n\t\t\t<search-search label="Catchments search">\r\n\t\t\t\t<common-catchment-search class="cossapSearch"></common-catchment-search>\r\n\t\t\t</search-search>\r\n\t\t</search-searches>\r\n\t\t<div class="pull-right">\r\n\t\t\t<div class="btn-toolbar radCore" role="toolbar"  water-toolbar>\r\n\t\t\t\t<div class="btn-group">\r\n\t\t\t\t\t<!-- < water-state-toggle></water-state-toggle> -->\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\r\n\t\t\t<div class="btn-toolbar" style="margin:right:10px;display:inline-block">\r\n\t\t\t\t<div class="btn-group">\r\n\t\t\t\t\t<span class="btn btn-default" common-baselayer-control max-zoom="16" title="Satellite to Topography bias on base map."></span>\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t</div>\r\n</div>'),t.put("water/vector/add.html","<button type='button' ng-disabled='!someSelected()' class='undecorated vector-add' ng-click='toggle()'>\r\n   <span class='fa-stack' tooltip-placement='right' uib-tooltip='Extract data from one or more vector types.'>\r\n\t   <i class='fa fa-lg fa-download' ng-class='{active:item.download}'></i>\r\n\t</span>\r\n</button>"),t.put("water/vector/download.html",""),t.put("water/vector/geoprocess.html",'<div class="container-fluid" style="overflow-x:hidden" ng-form>\r\n\t<div ng-show="stage==\'bbox\'">\r\n\t\t<div class="row">\r\n\t\t\t<div class="col-md-12">\r\n\t\t\t\t<wizard-clip trigger="stage == \'bbox\'" drawn="drawn()" clip="data.processing.clip" bounds="data.bounds"></wizard-clip>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div class="row" style="height:55px">\r\n \t\t\t<div class="col-md-12">\r\n\t\t\t\t<button class="btn btn-primary pull-right" ng-disabled="!validClip(data) || checkingOrFailed" ng-click="stage=\'formats\'">Next</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div class="well">\r\n\t\t\t<strong style="font-size:120%">Select an area of interest.</strong> There are two ways to select your area of interest:\r\n\t\t\t<ol>\r\n\t\t\t\t<li>Draw an area on the map with the mouse by clicking a corner and while holding the left mouse button\r\n\t\t\t\t\tdown drag diagonally across the map to the opposite corner or</li>\r\n\t\t\t\t<li>Type your co-ordinates into the areas above.</li>\r\n\t\t\t</ol>\r\n\t\t\tOnce drawn the points can be modified by the overwriting the values above or drawing another area by clicking the draw button again.\r\n\t\t\tEnsure you select from the highlighted areas as the data can be quite sparse for some data.<br/>\r\n\t\t\t<p style="padding-top:5px">\r\n\t\t\t<strong>Warning:</strong> Some extracts can be huge. It is best if you start with a small area to experiment with first. An email will be sent\r\n\t\t\twith the size of the extract. Download judiciously.\r\n\t\t\t</p>\r\n\t\t\t<p style="padding-top"><strong>Hint:</strong> If the map has focus, you can use the arrow keys to pan the map.\r\n\t\t\t\tYou can zoom in and out using the mouse wheel or the "+" and "-" map control on the top left of the map. If you\r\n\t\t\t\tdon\'t like the position of your drawn area, hit the "Draw" button and draw a new bounding box.\r\n\t\t\t</p>\r\n\t\t</div>\r\n\t</div>\r\n\r\n\t<div ng-show="stage==\'formats\'">\r\n\t\t<div class="well">\r\n\t\t<div class="row">\r\n  \t\t\t<div class="col-md-3">\r\n\t\t\t\t<label for="vectorGeoprocessOutputFormat">\r\n\t\t\t\t\tOutput Format\r\n\t\t\t\t</label>\r\n\t\t\t</div>\r\n\t\t\t<div class="col-md-9">\r\n\t\t\t\t<select id="vectorGeoprocessOutputFormat" style="width:95%" ng-model="data.processing.outFormat" ng-options="opt.value for opt in config.refData.vectorFileFormat"></select>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div class="row">\r\n\t\t\t<div class="col-md-3">\r\n\t\t\t\t<label for="geoprocessOutCoordSys">\r\n\t\t\t\t\tCoordinate System\r\n\t\t\t\t</label>\r\n\t\t\t</div>\r\n\t\t\t<div class="col-md-9">\r\n\t\t\t\t<select id="vectorGeoprocessOutCoordSys" style="width:95%" ng-model="data.processing.outCoordSys" ng-options="opt.value for opt in config.refData.outCoordSys | sysIntersect : data.processing.clip"></select>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t</div>\r\n\t\t<div class="row" style="height:55px">\r\n\t\t\t<div class="col-md-6">\r\n\t\t\t\t<button class="btn btn-primary" ng-click="stage=\'bbox\'">Previous</button>\r\n\t\t\t</div>\r\n\t\t\t<div class="col-md-6">\r\n\t\t\t\t<button class="btn btn-primary pull-right" ng-disabled="!validSansEmail(data)" ng-click="stage=\'email\'">Next</button>\r\n   \t\t\t</div>\r\n\t\t</div>\r\n\r\n\t\t<div class="well">\r\n\t\t\t<strong style="font-size:120%">Data representation.</strong> Select how you want your data presented.<br/>\r\n\t\t\tOutput format is the structure of the data and you should choose a format compatible with the tools that you will use to manipulate the data.\r\n\t\t\t<ul>\r\n\t\t\t\t<li ng-repeat="format in outFormats"><strong>{{format.value}}</strong> - {{format.description}}</li>\r\n\t\t\t</ul>\r\n\t\t\tSelect what <i>coordinate system</i> or projection you would like. If in doubt select WGS84.<br/>\r\n\t\t\tNot all projections cover all of Australia. If the area you select is not covered by a particular projection then the option to download in that projection will not be available.\r\n\t\t</div>\r\n\t</div>\r\n\r\n\t<div ng-show="stage==\'email\'">\r\n\t\t<div class="well" exp-enter="stage=\'confirm\'">\r\n\t\t\t<div download-email></div>\r\n\t\t\t<br/>\r\n\t\t\t<div download-filename data="data.processing"></div>\r\n\t\t</div>\r\n\t\t<div class="row" style="height:55px">\r\n\t\t\t<div class="col-md-6">\r\n\t\t\t\t<button class="btn btn-primary" ng-click="stage=\'formats\'">Previous</button>\r\n\t\t\t</div>\r\n\t\t\t<div class="col-md-6">\r\n\t\t\t\t<button class="btn btn-primary pull-right" ng-disabled="!allDataSet(data)" ng-click="stage=\'confirm\'">Submit</button>\r\n   \t\t\t</div>\r\n\t\t</div>\r\n\t\t<div class="well">\r\n\t\t\t<strong style="font-size:120%">Email notification</strong> The extract of data can take some time. By providing an email address we will be able to notify you when the job is complete. The email will provide a link to the extracted\r\n\t\t\tdata which will be packaged up as a single file. To be able to proceed you need to have provided:\r\n\t\t\t<ul>\r\n\t\t\t\t<li>An area of interest to extract the data (referred to as a bounding box).</li>\r\n\t\t\t\t<li>An output format.</li>\r\n\t\t\t\t<li>A valid coordinate system or projection.</li>\r\n\t\t\t\t<li>An email address to receive the details of the extraction.</li>\r\n\t\t\t\t<li><strong>Note:</strong>Email addresses need to be and are stored in the system.</li>\r\n\t\t\t</ul>\r\n\t\t\t<strong style="font-size:120%">Optional filename</strong> The extract of data can take some time. By providing an optional filename it will allow you\r\n\t\t\tto associate extracted data to your purpose for downloading data. For example:\r\n\t\t\t<ul>\r\n\t\t\t\t<li>myHouse will have a file named myHouse.zip</li>\r\n\t\t\t\t<li>Sorrento would result in a file named Sorrento.zip</li>\r\n\t\t\t</ul>\r\n\t\t</div>\r\n\t</div>\r\n\r\n\t<div ng-show="stage==\'confirm\'">\r\n\t\t<div class="row">\r\n\t\t\t<div class="col-md-12 abstractContainer">\r\n\t\t\t\t{{data.abstract}}\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<h3>You have chosen:</h3>\r\n\t\t<table class="table table-striped">\r\n\t\t\t<tbody>\r\n\t\t\t\t<tr>\r\n\t\t\t\t\t<th>Area</th>\r\n\t\t\t\t\t<td>\r\n\t\t\t\t\t\t<span style="display:inline-block; width: 10em">Lower left (lat/lng&deg;):</span> {{data.processing.clip.yMin | number : 6}}, {{data.processing.clip.xMin | number : 6}}<br/>\r\n\t\t\t\t\t\t<span style="display:inline-block;width: 10em">Upper right (lat/lng&deg;):</span> {{data.processing.clip.yMax | number : 6}}, {{data.processing.clip.xMax | number : 6}}\r\n\t\t\t\t\t</td>\r\n\t\t\t\t</tr>\r\n\t\t\t\t<tr>\r\n\t\t\t\t\t<th>Output format</th>\r\n\t\t\t\t\t<td>{{data.processing.outFormat.value}}</td>\r\n\t\t\t\t</tr>\r\n\t\t\t\t<tr>\r\n\t\t\t\t\t<th>Coordinate system</th>\r\n\t\t\t\t\t<td>{{data.processing.outCoordSys.value}}</td>\r\n\t\t\t\t</tr>\r\n\t\t\t\t<tr>\r\n\t\t\t\t\t<th>Email address</th>\r\n\t\t\t\t\t<td>{{email}}</td>\r\n\t\t\t\t</tr>\r\n\t\t\t\t<tr ng-show="data.processing.filename">\r\n\t\t\t\t\t<th>Filename</th>\r\n\t\t\t\t\t<td>{{data.processing.filename}}</td>\r\n\t\t\t\t</tr>\r\n\t\t\t</tbody>\r\n\t\t</table>\r\n\t\t<div class="row" style="height:55px">\r\n\t\t\t<div class="col-md-6">\r\n\t\t\t\t<button class="btn btn-primary" style="width:6em" ng-click="stage=\'email\'">Back</button>\r\n\t\t\t</div>\r\n\t\t\t<div class="col-md-6">\r\n\t\t\t\t<button class="btn btn-primary pull-right" ng-click="startExtract()">Confirm</button>\r\n   \t\t\t</div>\r\n\t\t</div>\r\n\t</div>\r\n</div>'),
t.put("water/vector/popup.html",'<exp-modal icon-class="fa-download"  is-open="data.item.download" title="Download wizard" on-close="vdl.remove()">\r\n\t<div class="container-fluid downloadInner" >\r\n\t\t<div class="row">\r\n  \t\t\t<div class="col-md-12">\r\n\t\t\t\t<h4><common-wms data="vdl.data.item"></common-wms>\r\n\t\t\t\t\t<a href="http://www.ga.gov.au/metadata-gateway/metadata/record/{{vdl.data.item.sysId}}" target="_blank"><strong class="ng-binding">{{vdl.data.item.title}}</strong></a>\r\n\t\t\t\t</h4>\r\n   \t\t\t</div>\r\n\t\t</div>\r\n\t\t<vector-geoprocess data="vdl.data.item"></vector-geoprocess>\r\n\t</div>\r\n</exp-modal>'),t.put("water/vector/vector.html",'<div class="panel panel-default" style="margin-bottom:-5px;">\r\n   <div class="panel-heading">\r\n\t\t<vector-add group="vect.group"></vector-add>\r\n      <common-tile data="vect.group"></common-tile>\r\n\t\t<common-bbox data="vect.group"></common-bbox>\r\n\t\t<common-cc></common-cc>\r\n      <strong>{{vect.group.title}}</strong>\r\n   </div>\r\n   <div class="panel-body">\r\n      <div ng-repeat="doc in vect.group.docs">\r\n         <div ng-class-odd="\'odd\'" ng-class-even="\'even\'" style="padding-left:12px" ng-mouseleave="vect.lolight(doc)" ng-mouseenter="vect.hilight(doc)" >\r\n            <span style="width:100%;display:inline-block;padding-bottom:8px">\r\n               <input type="checkbox" class="vector-checkbox" ng-model="doc.selected">\r\n\t\t         <common-metaview url="\'http://www.ga.gov.au/metadata-gateway/metadata/record/\' + doc.sysId + \'/xml\'" container="select" item="doc"></common-metaview>\r\n\t\t         <a href="http://www.ga.gov.au/metadata-gateway/metadata/record/{{doc.sysId}}" target="_blank" tooltip-append-to-body="true"\r\n                           uib-tooltip="{{doc.abstract}}" tooltip-placement="auto bottom" tooltip-class="vector-tooltip">\r\n                  <strong>{{doc.title}}</strong>\r\n               </a>\r\n\t         </span>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>')}]);