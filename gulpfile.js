var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var concat = require('gulp-concat');
var stylus = require('gulp-stylus');
var minifyCSS = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");
var sourcemaps = require('gulp-sourcemaps');

gulp.task('nodemon', function () {
  nodemon({
    script: 'server.js',
    ext: 'jade js',
    ignore: ['ignored.js'],
    watch: [
      "./app/",
      "./config/"
    ],
    env: {
      "NODE_ENV": "development"
    },
  })
    // .on('change', ['lint'])
    .on('restart', function () {
      console.log('app restarted!')
    });

});

gulp.task('stylus', function () {
  gulp.src(['./public/stylus/**.styl'])
    .pipe(stylus())
    .pipe(gulp.dest('./public/css'));
});

gulp.task('css', ['stylus'], function () {
  gulp.src([
    './public/lib/bootstrap/dist/css/bootstrap.min.css',
    './public/lib/smalot-bootstrap-datetimepicker/css/bootstrap-datetimepicker.css',
    './public/lib/alertify.js/themes/alertify.core.css',
    './public/lib/alertify.js/themes/alertify.default.css',
    './public/lib/angular-carousel/dist/angular-carousel.min.css',
    './public/lib/bootstrap-calendar/css/calendar.css'
  ])
    .pipe(concat('library.css'))
    .pipe(rename('library.min.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./public/css'));

  gulp.src([
    './public/css/donler.css',
    './public/css/timeline.css',
    './public/css/custom_alertify.css',
    './public/css/dl_card.css',
    './public/css/custom_calendar.css',
    './public/css/group_select.css',
    './public/css/campaign_list.css',
    './public/css/tree.css'
  ])
    .pipe(concat('donlerall.css'))
    .pipe(rename('donlerall.min.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./public/css'));
});

gulp.task('js', function () {

  gulp.src([
    './public/lib/jquery/jquery.js',
    './public/lib/angular/angular.js',
    './public/lib/angular-route/angular-route.js',
    './public/lib/moment/moment.js',
    './public/lib/moment/lang/zh-cn.js',
    './public/lib/bootstrap/dist/js/bootstrap.js',
    './public/lib/angular-translate/angular-translate.min.js',
    './public/lib/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js',
    './public/lib/angular-bootstrap/ui-bootstrap.js',
    './public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
    './public/lib/alertify.js/lib/alertify.min.js',
    './public/lib/masonry/dist/masonry.pkgd.min.js',
    './public/lib/angular-masonry/angular-masonry.js',
    './public/lib/smalot-bootstrap-datetimepicker/js/bootstrap-datetimepicker.min.js',
    './public/lib/smalot-bootstrap-datetimepicker/js/locales/bootstrap-datetimepicker.zh-CN.js',
    './public/lib/lazysizes/lazysizes.js',
    './public/lib/angular-touch/angular-touch.min.js',
    './public/lib/angular-carousel/dist/angular-carousel.js',
    './public/lib/angular-file-upload/angular-file-upload.min.js',
    './public/lib/underscore/underscore.js',
    './public/js/language/zh-CN.js',
    './public/lib/bootstrap-calendar/js/calendar.js'
  ])
    .pipe(concat('library.js'))
    .pipe(rename('library.min.js'))
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/js'));

  gulp.src([
    './public/js/modules/**/*.js',
    './public/js/app.js',
    './public/js/service/**.js',
    './public/js/controllers/message_header.js',
    './public/js/dl_card.js'
  ])
    .pipe(concat('donlerall.js'))
    .pipe(rename('donlerall.min.js'))
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/js'));

});

gulp.task('develop', ['nodemon', 'css', 'js']);

