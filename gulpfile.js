// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var fs            = require('fs');
var header        = require('gulp-header');
var jshint        = require('gulp-jshint');
var babel         = require('gulp-babel');
var sass          = require('gulp-sass');
var concat        = require('gulp-concat');
var concatCss     = require('gulp-concat-css');
var insert        = require('gulp-insert');
var uglify        = require('gulp-uglify');
var rename        = require('gulp-rename');
var templateCache = require('gulp-angular-templatecache');
var war           = require('gulp-war');
var zip           = require('gulp-zip');
var addStream     = require('add-stream');

var directories = {
	assets:      'dist/icsm/assets',
	source:      'source',
	resources:  'resources',
	outresources:'dist/icsm/resources',
   views:      'views',
   outbower:   'dist/icsm/bower_components'
};

// You can build it as a war file if you want to deploy to a srvlet container like Tomcat.
gulp.task('war', function () {
    gulp.src(["dist/**/*"])
        .pipe(war({
            welcome: 'index.html',
            displayName: 'FSDF Elvis WAR',
        }))
        .pipe(zip('fsdf-elvis.war'))
        .pipe(gulp.dest("."));
});

// Lint Task
gulp.task('lint', function() {
    return gulp.src(directories.source + '/**/*.js')
        .pipe(jshint({esversion: 6}))
        .pipe(jshint.reporter('default'));
});

gulp.task('resources', function () {
    return gulp.src(directories.resources + '/**/*')
        .pipe(gulp.dest(directories.outresources));
});

gulp.task('views', function () {
    return gulp.src(directories.views + '/*')
        .pipe(gulp.dest('dist'));
});

//Concatenate & Minify JS
gulp.task('scripts', ["commonScripts", "icsmScripts", "waterScripts", 'imageryScripts', 'startScripts', 'ltScripts']);

//Concatenate & Minify JS
gulp.task('commonScripts', function() {
   return prepareScripts('common');
});

gulp.task('icsmScripts', function() {
   return prepareScripts('icsm');
});

//Concatenate & Minify JS
gulp.task('waterScripts', function() {
   return prepareScripts('water');
});

//Concatenate & Minify JS
gulp.task('startScripts', function() {
   return prepareScripts('start');
});

//Concatenate & Minify JS
gulp.task('imageryScripts', function() {
   return prepareScripts('imagery');
});

//Concatenate & Minify JS
gulp.task('ltScripts', function() {
   return prepareScripts('lt');
});

function prepareScripts(name) {
   return gulp.src(directories.source + '/' + name + '/**/*.js')
      .pipe(babel({
            presets: ['es2015']
      }))
	   .pipe(addStream.obj(prepareNamedTemplates(name)))
      .pipe(concat(name + '.js'))
      .pipe(header(fs.readFileSync(directories.source + '/licence.txt', 'utf8')))
      .pipe(gulp.dest(directories.assets));
}


//Concatenate & Minify JS
gulp.task('squash', ['squashCommon','squashIcsm', 'squashWater', 'squashStart', 'squashImagery']);

gulp.task('squashCommon', function() {
	return gulp.src(directories.assets + '/common.js')
		.pipe(uglify())
      .pipe(header(fs.readFileSync(directories.source + '/licence.txt', 'utf8')))
		.pipe(gulp.dest(directories.assets + "/min"));
});
gulp.task('squashIcsm', function() {
	return squashJs('icsm');
});
gulp.task('squashWater', function() {
	return squashJs('water');
});
gulp.task('squashStart', function() {
	return squashJs('start');
});

gulp.task('squashImagery', function() {
	return squashJs('imagery');
});

gulp.task('squashLt', function() {
	return squashJs('lt');
});

function squashJs(name) {
	return gulp.src(directories.assets + '/' + name + '.js')
		.pipe(uglify())
		.pipe(gulp.dest(directories.assets + "/min"));
}


// Watch Files For Changes
gulp.task('watch', function() {
	// We watch both JS and HTML files.
    gulp.watch(directories.source + '/**/*(*.js|*.html)', ['lint']);
    gulp.watch(directories.source + '/common/**/*(*.js|*.html)', ['commonScripts']);
    gulp.watch(directories.source + '/icsm/**/*(*.js|*.html)', ['icsmScripts']);
    gulp.watch(directories.source + '/water/**/*(*.js|*.html)', ['waterScripts']);
    gulp.watch(directories.source + '/start/**/*(*.js|*.html)', ['startScripts']);
    gulp.watch(directories.source + '/imagery/**/*(*.js|*.html)', ['imageryScripts']);
    gulp.watch(directories.source + '/lt/**/*(*.js|*.html)', ['ltScripts']);
    gulp.watch(directories.source + '/**/*.css', ['concatCss']);
    gulp.watch(directories.assets + '/common.js', ['squashCommon']);
    gulp.watch(directories.assets + '/icsm.js', ['squashIcsm']);
    gulp.watch(directories.assets + '/water.js', ['squashWater']);
    gulp.watch(directories.assets + '/start.js', ['squashStart']);
    gulp.watch(directories.assets + '/imagery.js', ['squashImagery']);
    gulp.watch(directories.assets + '/lt.js', ['squashLt']);
    gulp.watch(directories.views +  '/*', ['views']);
    gulp.watch(directories.resources + '/**/*', ['resources']);
    //gulp.watch('scss/*.scss', ['sass']);
});

gulp.task('concatCss', function () {
  return gulp.src(directories.source + '/**/*.css')
    .pipe(concatCss("icsm.css"))
    .pipe(gulp.dest(directories.assets));
});

gulp.task('package', function() {
   return gulp.src('package.json')
      .pipe(gulp.dest(directories.assets));
});

gulp.task('build', ['views', 'package', 'scripts', 'concatCss', 'resources'])

// Default Task
gulp.task('default', ['lint', 'scripts', 'concatCss', 'watch', 'package', 'resources', 'views']);

function prepareCommonTemplates() {
   return gulp.src(directories.source + '/common/**/*.html')
      .pipe(templateCache({module:"common.templates", root:'common', standalone : true}));
}

function prepareIcsmTemplates() {
   return gulp.src(directories.source + '/icsm/**/*.html')
      .pipe(templateCache({module:"icsm.templates", root:'icsm', standalone : true}));
}

function prepareWaterTemplates() {
   return gulp.src(directories.source + '/water/**/*.html')
      .pipe(templateCache({module:"water.templates", root:'water', standalone : true}));
}

function prepareStartTemplates() {
   return gulp.src(directories.source + '/start/**/*.html')
      .pipe(templateCache({module:"start.templates", root:'start', standalone : true}));
}

function prepareImageryTemplates() {
   return gulp.src(directories.source + '/imagery/**/*.html')
      .pipe(templateCache({module:"imagery.templates", root:'imagery', standalone : true}));
}

function prepareNamedTemplates(name) {
   return gulp.src(directories.source + '/' + name + '/**/*.html')
      .pipe(templateCache({module: name + ".templates", root:name, standalone : true}));
}