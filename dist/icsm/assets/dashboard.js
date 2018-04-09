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

   var config = {
      tabs: [{
         select: "",
         heading: "Dashboard Home"
      }, {
         select: "/DailyTotalRunningTime",
         heading: "Daily Total Running Time"
      }, {
         select: "/DailyTotalQueuedTime",
         heading: "Daily Total Queued Time"
      }, {
         select: "/DailyTotalJobs",
         heading: "Daily Total Jobs"
      }, {
         select: "/AverageRunningTime",
         heading: "Average Running Time"
      }, {
         select: "/FailuresByWorkspace",
         heading: "Failures By Workspace"
      }],
      baseUrl: "https://elvis-ga.fmecloud.com/fmeserver/#/dashboards"
   };

   angular.module("DashboardApp", ['exp.ui.templates', 'common.header', 'common.templates', 'page.footer', 'ui.bootstrap']).controller('dashCtrl', function () {
      this.config = config;

      this.selected = function (value) {
         if (value) {
            value = value + ".html";
         }
         document.getElementById("launcher").src = config.baseUrl + value;
      };
   });
})(angular);