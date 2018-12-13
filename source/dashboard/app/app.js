(function(angular) {
'use strict';
var config = {
   tabs: [
      {
         select: "",
         heading: "Dashboard Home"
      },
      {
         select: "/DailyTotalRunningTime",
         heading: "Daily Total Running Time"
      },
      {
         select: "/DailyTotalQueuedTime",
         heading: "Daily Total Queued Time"
      },
      {
         select: "/DailyTotalJobs",
         heading: "Daily Total Jobs"
      },
      {
         select: "/AverageRunningTime",
         heading: "Average Running Time"
      },
      {
         select: "/FailuresByWorkspace",
         heading: "Failures By Workspace"
      }
   ],
   baseUrl: "https://elvis2018-ga.fmecloud.com/fmeserver/#/dashboards"
};

angular.module("DashboardApp", [
      'exp.ui.templates',
		'common.header',
      'common.templates',
		'page.footer',
      'ui.bootstrap'
   ])

   .controller('dashCtrl', function() {
      this.config = config;

      this.selected = function(value) {
         if(value) {
            value = value + ".html";
         }
         document.getElementById("launcher").src = config.baseUrl + value;
      };
   });
})(angular);