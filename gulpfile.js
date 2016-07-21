// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint        = require('gulp-jshint');
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

gulp.task('war', function () {
    gulp.src(["dist/**/*"])
        .pipe(war({
            welcome: 'index.html',
            displayName: 'ICSM WAR',
        }))
        .pipe(zip('icsm.war'))
        .pipe(gulp.dest("."));
});

// Lint Task
gulp.task('lint', function() {
    return gulp.src(directories.source + '/**/*.js')
        .pipe(jshint())
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
gulp.task('scripts', ["commonScripts", "icsmScripts", "waterScripts"]);

//Concatenate & Minify JS
gulp.task('commonScripts', function() {
   return gulp.src(directories.source + '/common/**/*.js')
	   .pipe(addStream.obj(prepareCommonTemplates()))
      .pipe(concat('common.js'))
      .pipe(gulp.dest(directories.assets));
});

gulp.task('icsmScripts', function() {
   return gulp.src(directories.source + '/icsm/**/*.js')
	   .pipe(addStream.obj(prepareIcsmTemplates()))
      .pipe(concat('icsm.js'))
      .pipe(gulp.dest(directories.assets));
});

//Concatenate & Minify JS
gulp.task('waterScripts', function() {
   return gulp.src(directories.source + '/water/**/*.js')
	   .pipe(addStream.obj(prepareWaterTemplates()))
      .pipe(concat('water.js'))
      .pipe(gulp.dest(directories.assets));
});

//Concatenate & Minify JS
gulp.task('squashCommon', function() {
	return gulp.src(directories.assets + '/common.js')
		.pipe(uglify())
		.pipe(gulp.dest(directories.assets + "/min"));
});
gulp.task('squashIcsm', function() {
	return gulp.src(directories.assets + '/icsm.js')
		.pipe(uglify())
		.pipe(gulp.dest(directories.assets + "/min"));
});
gulp.task('squashWater', function() {
	return gulp.src(directories.assets + '/water.js')
		.pipe(uglify())
		.pipe(gulp.dest(directories.assets + "/min"));
});

// Watch Files For Changes
gulp.task('watch', function() {
	// We watch both JS and HTML files.
    gulp.watch(directories.source + '/**/*(*.js|*.html)', ['lint']);
    gulp.watch(directories.source + '/common/**/*(*.js|*.html)', ['commonScripts']);
    gulp.watch(directories.source + '/icsm/**/*(*.js|*.html)', ['icsmScripts']);
    gulp.watch(directories.source + '/water/**/*(*.js|*.html)', ['waterScripts']);
    gulp.watch(directories.source + '/**/*.css', ['concatCss']);
    gulp.watch(directories.assets + '/common.js', ['squashCommon']);
    gulp.watch(directories.assets + '/icsm.js', ['squashIcsm']);
    gulp.watch(directories.assets + '/water.js', ['squashWater']);
    gulp.watch(directories.views +  '/*', ['views']);
    gulp.watch(directories.resources + '/**/*', ['resources']);
    //gulp.watch('scss/*.scss', ['sass']);
});

// Inject dist, bower, and resource files
gulp.task('inject', ['scripts', 'minifyCss'], function() {
	// wire up all src files
	var injectSrc = gulp.src([

		// our dist files
		directories.assets + '/icsm.css',
		directories.assets + '/icsm.js',
		directories.assets + '/common.js'
	], { read: false });

	var injectOptions = {
		ignorePath: '/dist',
		relative: true
	};

	// inject bower deps
	var options = {
		bowerJson: require('./bower.json'),
		directory: directories.outbower,
		ignorePath:  /^(\.\.\/)*\.\./
	};

	return gulp.src('./dist/*.html')
		.pipe(wiredep(options))
		.pipe(inject(injectSrc, injectOptions))
		.pipe(gulp.dest('./dist'));

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