// Include gulp
let {series, src, dest, watch} = require('gulp');

// Include Our Plugins
let fs            = require('fs');
let header        = require('gulp-header');
let eslint        = require('gulp-eslint');
let babel         = require('gulp-babel');
let concat        = require('gulp-concat');
let concatCss     = require('gulp-concat-css');
let uglify        = require('gulp-uglify');
let templateCache = require('gulp-angular-templatecache');
let addStream     = require('add-stream');

let directories = {
	assets:      'dist/icsm/assets',
	source:      'source',
	resources:  'resources',
	outresources:'dist/icsm/resources',
   views:      'views',
   outbower:   'dist/icsm/bower_components'
};

const babelConfig = {
   compact: false,
   comments: true,
   presets: ['@babel/preset-env']
}

// Lint Task
function lint() {
    return src(directories.source + '/**/*.js')
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
}
exports.lint = lint;

function resources() {
    return src(directories.resources + '/**/*')
        .pipe(dest(directories.outresources));
}
exports.resources = resources;

function views() {
    return src(directories.views + '/**/*')
        .pipe(dest('dist'));
}
exports.views = views;

//Concatenate & Minify JS
let scripts = exports.scripts = series(commonScripts, dashboardScripts, placenamesScripts, icsmScripts, startScripts);

//Concatenate & Minify JS
function commonScripts() {
   return prepareScripts('common');
}
exports.commonScripts = commonScripts;

function icsmScripts() {
   return prepareScripts('icsm');
}
exports.icsmScripts = icsmScripts;

//Concatenate & Minify JS
function startScripts() {
   return prepareScripts('start');
}
exports.startScripts = startScripts;

//Concatenate & Minify JS
function dashboardScripts() {
   return prepareScripts('dashboard');
}
exports.dashboardScripts = dashboardScripts;

//Concatenate & Minify JS
function placenamesScripts() {
   return prepareScripts('placenames');
}
exports.placenamesScripts = placenamesScripts;

function prepareScripts(name) {
   return src(directories.source + '/' + name + '/**/*.js')
      .pipe(babel(babelConfig))
	   .pipe(addStream.obj(prepareNamedTemplates(name)))
      .pipe(concat(name + '.js'))
      .pipe(header(fs.readFileSync(directories.source + '/licence.txt', 'utf8')))
      .pipe(dest(directories.assets));
}

function squashCommon() {
	return src(directories.assets + '/common.js')
      .pipe(babel(babelConfig))
		.pipe(uglify())
      .pipe(header(fs.readFileSync(directories.source + '/licence.txt', 'utf8')))
		.pipe(dest(directories.assets + "/min"));
}
exports.squashCommon = squashCommon;

function squashIcsm() {
	return squashJs('icsm');
}
exports.squashIcsm = squashIcsm;

function squashStart() {
	return squashJs('start');
}
exports.squashStart = squashStart;


// Watch Files For Changes
function watchFiles() {
	// We watch both JS and HTML files.
   let ignore = { ignoreInitial: false };

   watch(directories.source + '/**/*(*.js|*.html)', ignore, lint);
   watch(directories.source + '/common/**/*(*.js|*.html)', ignore, commonScripts);
   watch(directories.source + '/icsm/**/*(*.js|*.html)', ignore, icsmScripts);
   watch(directories.source + '/dashboard/**/*(*.js|*.html)', ignore, dashboardScripts);
   watch(directories.source + '/placenames/**/*(*.js|*.html)', ignore, placenamesScripts);
   watch(directories.source + '/start/**/*(*.js|*.html)', ignore, startScripts);
   watch(directories.source + '/**/*.css', ignore, catCss);
   watch(directories.assets + '/common.js', squashCommon);
   watch(directories.assets + '/icsm.js', squashIcsm);
   watch(directories.assets + '/start.js', squashStart);
   watch(directories.views +  '/*', ignore, views);
   watch(directories.resources + '/**/*', ignore, resources);
   watch('package.json', ignore, package);
}
exports.watch = watchFiles;

function catCss() {
  return src(directories.source + '/**/*.css')
    .pipe(concatCss("icsm.css"))
    .pipe(dest(directories.assets));
}
exports.concatCss = catCss;

function package() {
   return src('package.json')
      .pipe(dest(directories.assets));
}
exports.package = package;


function prepareNamedTemplates(name) {
   return src(directories.source + '/' + name + '/**/*.html')
      .pipe(templateCache({module: name + ".templates", root:name, standalone : true}));
}

function squashJs(name) {
	return src(directories.assets + '/' + name + '.js')
		.pipe(uglify())
		.pipe(dest(directories.assets + "/min"));
}

exports.build = series(views, package, scripts, catCss, resources);

// Default Task
exports.default = series(package, views, watchFiles);