
// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------

var gulpConfig         = require('./gulpCongig.json');

var path           = require('path');
var fs             = require('fs');
var gulp           = require('gulp');

// SCSS
var sass           = require('gulp-sass');
var sourcemaps     = require('gulp-sourcemaps');
var autoprefixer   = require('gulp-autoprefixer');
var cssnano        = require('gulp-cssnano');

// Browserify
var browserify     = require('browserify');
var watchify       = require('watchify');
var source         = require('vinyl-source-stream');
var buffer         = require('vinyl-buffer');

// Gulp plugins
var gutil          = require('gulp-util');
var watch          = require('gulp-watch')
var gulpif         = require('gulp-if');
var notifier       = require('node-notifier');
var rename         = require('gulp-rename');
var del            = require('del');
var uglify         = require('gulp-uglify');
var cache          = require('gulp-cache');

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

var argv = require('yargs').argv;

const filePaths = gulpConfig.filePaths;

const autoprefixConfig = gulpConfig.autoprefixConfig;



var production = argv.prod || false;

// -----------------------------------------------------------------------------
// Debug
// -----------------------------------------------------------------------------

var debug = argv.debug || false;

if (debug) {
	console.log('*********************************************');
	console.log ( gutil.colors.cyan.bold('Filepaths:') );
	console.log(filePaths);
	console.log ( gutil.colors.cyan.bold('Autoprefixer config:') );
	console.log(autoprefixConfig);
	console.log('*********************************************');
	process.env.BROWSERIFYSHIM_DIAGNOSTICS=1;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

var onError = function (err) {
	var errorElements = ['plugin', 'fileName', 'line']
	console.log('*********************************************');
	console.log ( gutil.colors.bgRed.white('Compiation error.') );
	errorElements.forEach(function(el){
		if (err.hasOwnProperty(el)) {
			console.log ( gutil.colors.red.bold(el.toUpperCase() + ': ', err[el]) );
		}
	})
	console.log ( gutil.colors.white(err.message) );
	console.log('*********************************************');
	notifier.notify({
		'title': err.name,
		'message': err.fileName || err.message,
		'sound': true
	})
	this.emit('end');
};

// -----------------------------------------------------------------------------
// CSS
// -----------------------------------------------------------------------------

function buildCss() {
	del( path.join(filePaths.dest.css, '*.map') );

	return gulp.src(path.join(filePaths.src.css, '**/*.scss'))
	.pipe( gulpif(!production, sourcemaps.init() ) )
	.pipe( sass().on('error', onError) )
	.pipe( autoprefixer(autoprefixConfig) )
	.pipe( gulpif( production,
				cssnano({
					autoprefixer: false,
					zindex: false
				})
			)
	)
	.pipe( rename({ suffix: '.min' }) )
	.pipe( gulpif(!production, sourcemaps.write('.') ) )
	.pipe( gulp.dest(filePaths.dest.css) )
}

function watchCss() {
	watch( path.join(filePaths.src.css, '**/*.scss'), ['build:css'])
}

gulp.task('build:css', buildCss);

gulp.task('watch:css', function(){
	watchCss();
});

// -----------------------------------------------------------------------------
// Javascript
// -----------------------------------------------------------------------------

function createBundle(bundler) {
	del( path.join( filePaths.dest.js, '*.map') );
	fs.access(filePaths.src.jsMain, fs.R_OK, function(err){
		if (err)
			return gutil.log ( gutil.colors.red.bold('No JS file found: ignoring javascript build') );
		return bundler.bundle()
			.on('error', onError)
			.pipe( source(path.basename(filePaths.src.jsMain)) )
			.pipe( buffer() )
			.pipe( gulpif(!production, sourcemaps.init() ) )
			.pipe( rename({ suffix: '.min' }) )
			.pipe( gulpif(production, uglify()) )
			.pipe( gulpif(!production, sourcemaps.write('.') ) )
			.pipe( gulp.dest(filePaths.dest.js) )
	})
}

function buildJs(){
	var bundler = browserify(filePaths.src.jsMain);
	createBundle(bundler);
}
function watchJs(){
	var bundler = browserify(filePaths.src.jsMain);
	bundler.plugin(watchify, {ignoreWatch: ['**/node_modules/**', '**/bower_components/**']});
	createBundle(bundler);
	bundler.on('update', function(){
		createBundle(bundler);
	})
}

gulp.task('build:js', buildJs);

gulp.task('watch:js', function(){
	watchJs();
});

// -----------------------------------------------------------------------------
// General
// -----------------------------------------------------------------------------

gulp.task('build', ['build:css', 'build:js']);
gulp.task('watch', function(){
	watchCss();
	watchJs();
});

gulp.task('default', ['build']);
