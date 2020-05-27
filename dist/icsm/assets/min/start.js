"use strict";angular.module("start.navigation",[]).directive("startNavigation",["altthemesService",function(e){return{restrict:"AE",templateUrl:"start/navigation/navigation.html",link:function(t){e.getThemes().then(function(e){t.themes=e}),t.username="Anonymous"}}}]),function(){function e(e,t){var n=this;t.getConfig().then(function(t){n.data=t;try{var e=document.createElement("canvas");t.modern=!(!window.WebGLRenderingContext||!e.getContext("webgl")&&!e.getContext("experimental-webgl"))}catch(e){t.modern=!1}})}angular.module("StartApp",["common.altthemes","common.header","common.navigation","common.storage","common.templates","explorer.config","explorer.confirm","explorer.drag","explorer.enter","explorer.flasher","explorer.googleanalytics","explorer.httpdata","explorer.info","explorer.legend","explorer.message","explorer.modal","explorer.projects","explorer.tabs","explorer.version","exp.ui.templates","start.navigation","start.templates","ui.bootstrap","ngRoute","ngSanitize","page.footer"]).config(["configServiceProvider","projectsServiceProvider","versionServiceProvider",function(e,t,n){e.location("icsm/resources/config/start.json"),e.dynamicLocation("icsm/resources/config/appConfig.json?t="),n.url("icsm/assets/package.json"),t.setProject("icsm")}]).factory("userService",[function(){return{login:e,hasAcceptedTerms:e,setAcceptedTerms:e,getUsername:function(){return"anon"}};function e(){return!0}}]).controller("RootCtrl",e),e.$invoke=["$http","configService"]}(),angular.module("start.templates",[]).run(["$templateCache",function(e){e.put("start/navigation/navigation.html",'<div class="container-fluid start-content-container">\r\n   <div class="panel panel-default" ng-repeat="item in themes">\r\n      <div class="panel-body">\r\n         <div class="row">\r\n            <div class="col-md-2">\r\n               <button ng-attr-title="{{item.title}}"><span class="select-icon select-{{item.code}}"></span></button>\r\n            </div>\r\n            <div class="col-md-8">\r\n               <h3>{{item.label}}</h3>\r\n               {{item.description}}\r\n            </div>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>')}]);