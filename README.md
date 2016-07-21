## explorer-icsm

Elevation clip, zip and ship ICSM.

### Getting started
There are some things to do to get started. If you want to automate it more go ahead.
* Make sure you have NodeJS, NPM, Gulp and Bower installed globally
* > npm install
* > bower install
* > gulp

Always leave gulp running as it builds the concatenated JS and CSS on the fly.

In the future, when metadata searching is turned back on you will need find some way to proxy to the NaviGAtor Solr instance when working locally. Typically run an Apache web server and have these entries equivalent to these to make it work.

``` HTTP Proxy entries
ProxyPass /csw-indexer/  http://www-test.ga.gov.au/csw-indexer/ retry=10
ProxyPassReverse /csw-indexer/ http://www-test.ga.gov.au/csw-indexer/
```

