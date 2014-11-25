var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var concat = require('gulp-concat');
var stylus = require('gulp-stylus');
var minifyCSS = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");
var sourcemaps = require('gulp-sourcemaps');
var watch = require('gulp-watch');
var changed = require('gulp-changed');
var jade = require('gulp-jade');
var clean = require('gulp-clean');
var cache = require('gulp-cached');
var debug = require('gulp-debug');
var newer = require('gulp-newer');

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
    .on('restart', function () {
      console.log('app restarted!')
    });

});


gulp.task('stylus', function () {
  var src = './public/stylus/**.styl';
  gulp.src(src)
    .pipe(watch(src))
    .pipe(stylus())
    .pipe(gulp.dest('./public/css/donler'));
});


gulp.task('css:library', function () {
  gulp.src([
    './public/lib/smalot-bootstrap-datetimepicker/css/bootstrap-datetimepicker.css',
    './public/lib/alertify.js/themes/alertify.core.css',
    './public/lib/alertify.js/themes/alertify.default.css',
    './public/lib/angular-carousel/dist/angular-carousel.min.css',
    './public/lib/bootstrap-calendar/css/calendar.css',
    './public/css/library/font-awesome.css',
    './public/css/library/jquery.Jcrop.min.css',
    './public/css/library/bootstrap-tagsinput.css',
    './public/lib/pen/src/pen.css'
  ])
    .pipe(concat('library.css'))
    .pipe(gulp.dest('./public/css'))
    .pipe(rename('library.min.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./public/css'));
});
var donlerCssSrc = [
  './public/css/donler/**.css'
];
gulp.task('css:donler', function () {
  gulp.src(donlerCssSrc)
    .pipe(concat('donlerall.css'))
    .pipe(gulp.dest('./public/css'))
    .pipe(rename('donlerall.min.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./public/css'));
});
gulp.task('css', ['css:library', 'css:donler']);


gulp.task('js:library', function () {
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
    .pipe(gulp.dest('./public/js'))
    .pipe(rename('library.min.js'))
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/js'));
});
var donlerJsSrc = [
  './public/js/modules/**/*.js',
  './public/js/app.js',
  './public/js/service/**.js',
  './public/js/controllers/message_header.js',
  './public/js/dl_card.js'
];
gulp.task('js:donler', function () {
  gulp.src(donlerJsSrc)
    .pipe(concat('donlerall.js'))
    .pipe(gulp.dest('./public/js'))
    .pipe(rename('donlerall.min.js'))
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/js'));
});
gulp.task('js', ['js:library', 'js:donler']);


gulp.task('jade', function () {
  var src = './app/views/components/*.jade';
  gulp.src(src)
    .pipe(watch(src))
    .pipe(jade())
    .pipe(gulp.dest('./public/component_templates'));
});

gulp.task('clean', function () {
  gulp.src([
      './public/css/donler/**.css',
      './public/css/donlerall.css',
      './public/css/donlerall.min.css',
      './public/css/library.css',
      './public/css/library.min.css'
    ], {read: false})
    .pipe(clean())
    .pipe(gulp.dest('./public/css/trash'));
});

gulp.task('watch:donlerCss', function () {
  gulp.watch(donlerCssSrc, ['css:donler']);
});
gulp.task('watch:donlerJs', function () {
  gulp.watch(donlerJsSrc, ['js:donler']);
});
gulp.task('watch', ['watch:donlerJs', 'watch:donlerCss']);


gulp.task('develop', ['nodemon', 'stylus', 'css', 'js', 'jade', 'watch']);
gulp.task('default', ['develop']);

