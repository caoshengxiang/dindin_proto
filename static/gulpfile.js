/* globals require, process, console, __dirname */

'use strict';

var gulp = require('gulp'),
    webserver = require('gulp-webserver'),
    gulpClean = require('gulp-clean'),
    sass = require('gulp-ruby-sass'),
    debug = require('gulp-debug'),
    uglify = require('gulp-uglify'),
    minifyCSS = require('gulp-minify-css'),
    // minifyHTML = require('gulp-minify-html'),
    runSequence = require('run-sequence'),
    rjsOptimize = require('gulp-requirejs-optimize'),
    rename = require('gulp-rename'),
    inject = require('gulp-inject-string');


gulp.task('runserver', function () {
  var args = process.argv,
      port = args[3] ? args[3].slice(2) : 8000;

  return gulp.src('../../dindin_proto')
    .pipe(webserver({
      livereload: false,
      open: true,
      port: port
    }));
});


gulp.task('compile-css', function () {
  // Compile sass and/or scss files to css
  return sass('styles/sass/*.scss')
    .pipe(gulp.dest('styles/css'));
});


gulp.task('compile-js', function () {
  var warningMes = '/** WARNING!!!!!!!! \n * DO NOT EDIT THIS FILE!!!! \n * THIS FILE IS COMPILED FROM SOURCE; \n */ \n';
  return gulp.src('js/src/**/*.js')
    .pipe(inject.afterEach('\n\n', warningMes))
    .pipe(debug())
    .pipe(gulp.dest('js/build'));
});


gulp.task('compile-html', function () {
  var warningMes = '<!-- WARNING!!!!!!!! \n * DO NOT EDIT THIS FILE!!!! \n * THIS FILE IS COMPILED FROM SOURCE; \n --> \n';

  return gulp.src('js/src/**/*.html')
    .pipe(inject.prepend(warningMes))
    .pipe(gulp.dest('js/build'));
});


gulp.task('build-js', function () {
  var args = process.argv,
      optimizeOpt = args[3] ? args[3].slice(2) : 'uglify';

  return gulp.src('js/src/app.js')
      .pipe(rjsOptimize({
        optimize: optimizeOpt,
        paths: {
          jquery:     '../lib/jquery.min',
          underscore: '../lib/underscore.min',
          backbone:   '../lib/backbone.min',
          handlebars: '../lib/handlebars.min',
          text:       '../lib/text',
          templates:  'templates/',
          transition:   '../lib/transition',
          dropdown:   '../lib/dropdown',
          bouncefix:  '../lib/bouncefix'
        },
        shim: {
          underscore: {
            exports: '_'
          },
          backbone: {
            deps: [
              'underscore',
              'jquery'
            ],
            exports: 'Backbone'
          },
          handlebars: {
            exports: 'Handlebars'
          }
        },

        /**
         * exclude all lib files
         */
        exclude: [
          'jquery',
          'underscore',
          'backbone',
          'handlebars',
          'text',
          'transition',
          'dropdown'
        ],

        include: ['stdrequire', 'base', 'router', 'app']
      }))
      .pipe(gulp.dest('js/build/'));
});

gulp.task('clean', function () {
  var args = process.argv,
      type = args[3] ? args[3].slice(2) : 'all',
      dest;

  if (type === 'js') {
    dest = 'js/build';
  } else if (type === 'css') {
    dest = 'styles/css';
  } else {
    dest = ['js/build', 'styles/css'];
  }

  return gulp.src(dest)
    .pipe(gulpClean());
});

gulp.task('newApp', function() {
  var fs = require('fs'),
      args = process.argv,
      newAppName = args[3].slice(2),
      currDir = __dirname,
      appDir;

  console.log('Creating new app: ' + newAppName);

  var createNewAppFolder = function (newAppName) {
    appDir = currDir + '/js/src/apps/' + newAppName;

    if (!fs.exists(appDir)) {
      fs.mkdir(appDir);
      createNewAppModules(appDir);
    } else {
      console.log('App with the same name exists.');
      return;
    }
  };

  var createNewAppModules = function (appDir) {
      var scriptsDir = appDir + '/scripts',
          templatesDir = appDir + '/templates',
          modelsDir = scriptsDir + '/models',
          viewsDir = scriptsDir + '/views';

      var dirs = [scriptsDir, templatesDir, modelsDir, viewsDir];

      console.log('>> Setting up app modules ...');

      for (var i = 0, len = dirs.length; i < len; i++) {
        if (!fs.exists(dirs[i])) {
          fs.mkdir(dirs[i]);
        } else {
          console.log('This directory already exists.');
          return;
        }
      }

  };


  return createNewAppFolder(newAppName);
});

gulp.task('build', function () {
  runSequence('clean', [
    'compile-css', 'build-js'
    ]);
});

gulp.task('default', ['compile-css', 'compile-html', 'compile-js', 'runserver'], function () {
  gulp.watch('styles/sass/**/*.scss', ['compile-css']);
  gulp.watch('js/src/**/*.js', ['compile-js']);
  gulp.watch('js/src/**/*.html', ['compile-html']);
});