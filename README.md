## FSDF ELVIS

Elevation clip, zip and ship ICSM.

### Getting started
There are some things to do to get started. If you want to automate it more go ahead.
* Make sure you have NodeJS, NPM, Gulp and Bower installed globally
* > npm install
* > bower install
* > gulp

Always leave gulp running as it builds the concatenated JS and CSS on the fly.

### How it builds
Everything builds into the dist directory. It builds to have a small foot print so that it can
easily be overlayed with other applications with little likelyhood of name clashes with:
* The HTML at the base (this is where it is most likely to clash)
* All other content under the icsm directory.

### Optional war build
You can optionally package it up as a war, from the command line:
> gulp war

This builds the deployable artefact into the base of the project, "fsdf-elvis.war"