'use strict';

var gulp = require('gulp'),
  clean = require('gulp-clean'),
  browserSync = require('browser-sync'),
  nodemon = require('gulp-nodemon'),
  server = require('gulp-express'),
  reload = browserSync.reload;


gulp.task('clean', function(){
  return gulp.src([
    './_cache/*',
    '!./static/robots.txt',
    './static/*'], {read: false}
    )
    .pipe(clean());
});

gulp.task('nodeStart', function(){
  return nodemon({
        script: 'app.js'
      })
      .on('restart', function () {
          console.log('restarted!');
      });
});

// watch files for changes and reload
gulp.task('serve', ['clean','nodeStart'],function() {

  // gulp.watch(['*.js'], reload);

});
