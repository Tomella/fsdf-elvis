## ELVIS - Elevation

ELVIS - Elevation clip, zip and ship ICSM.

### Getting started
There are some things to do to get started. If you want to automate it more go ahead.
* Make sure you have NodeJS, NPM, Gulp and Bower installed globally
* > cd fsdf-elvis
* > npm install
* > bower install
* > gulp

Always leave gulp running as it builds the concatenated JS and CSS on the fly.
Serve up your content:
> node server

### How it builds
Everything builds into the dist directory. It builds to have a small foot print so that it can
easily be overlayed with other applications with little likelyhood of name clashes with:
* The HTML at the base (this is where it is most likely to clash)
* All other content under the icsm directory.

### How it runs
#### Postioning
It requires a couple of environment variables
ESRI_USERNAME The username to use to generate a token,
ESRI_PASWORD The password needed to generate a token.


### Google API.
At the moment the registered Google API key for the cloud VM is in the HTML files. If you want it to work on
your machine you'll have to register your own API key otherwise Google will block the page from working correctly.

I'll look into NOT using the Google functionality.