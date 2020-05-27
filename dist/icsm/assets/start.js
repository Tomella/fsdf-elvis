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

"use strict";

(function (angular) {
  'use strict';

  angular.module('start.navigation', [])
  /**
   *
   * Override the original mars user.
   *
   */
  .directive('startNavigation', ['altthemesService', function (altthemesService) {
    return {
      restrict: 'AE',
      templateUrl: 'start/navigation/navigation.html',
      link: function link(scope) {
        altthemesService.getThemes().then(function (themes) {
          scope.themes = themes;
        });
        scope.username = "Anonymous";
      }
    };
  }]);
})(angular);
"use strict";

(function (angular) {
  'use strict';

  angular.module("StartApp", ['common.altthemes', 'common.header', 'common.navigation', 'common.storage', 'common.templates', 'explorer.config', 'explorer.confirm', 'explorer.drag', 'explorer.enter', 'explorer.flasher', 'explorer.googleanalytics', 'explorer.httpdata', 'explorer.info', 'explorer.legend', 'explorer.message', 'explorer.modal', 'explorer.projects', 'explorer.tabs', 'explorer.version', 'exp.ui.templates', 'start.navigation', 'start.templates', 'ui.bootstrap', 'ngRoute', 'ngSanitize', 'page.footer']) // Set up all the service providers here.
  .config(['configServiceProvider', 'projectsServiceProvider', 'versionServiceProvider', function (configServiceProvider, projectsServiceProvider, versionServiceProvider) {
    configServiceProvider.location("icsm/resources/config/start.json");
    configServiceProvider.dynamicLocation("icsm/resources/config/appConfig.json?t=");
    versionServiceProvider.url("icsm/assets/package.json");
    projectsServiceProvider.setProject("icsm");
  }]).factory("userService", [function () {
    return {
      login: noop,
      hasAcceptedTerms: noop,
      setAcceptedTerms: noop,
      getUsername: function getUsername() {
        return "anon";
      }
    };

    function noop() {
      return true;
    }
  }]).controller("RootCtrl", RootCtrl);
  RootCtrl.$invoke = ['$http', 'configService'];

  function RootCtrl($http, configService) {
    var _this = this;

    configService.getConfig().then(function (data) {
      _this.data = data; // If its got WebGL its got everything we need.

      try {
        var canvas = document.createElement('canvas');
        data.modern = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        data.modern = false;
      }
    });
  }
})(angular);
angular.module('start.templates', []).run(['$templateCache', function($templateCache) {$templateCache.put('start/navigation/navigation.html','<div class="container-fluid start-content-container">\r\n   <div class="panel panel-default" ng-repeat="item in themes">\r\n      <div class="panel-body">\r\n         <div class="row">\r\n            <div class="col-md-2">\r\n               <button ng-attr-title="{{item.title}}"><span class="select-icon select-{{item.code}}"></span></button>\r\n            </div>\r\n            <div class="col-md-8">\r\n               <h3>{{item.label}}</h3>\r\n               {{item.description}}\r\n            </div>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>');}]);