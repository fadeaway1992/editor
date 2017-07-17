var gulp = require('gulp')
var autoprefixer = require('gulp-autoprefixer')
var sass = require('gulp-sass')
var concat = require('gulp-concat')

var concatArr = [
    'src/js/start.js',
    'src/js/globals.js',
    'src/js/util.js',
    'src/js/selection.js',
    'src/js/events.js',
    'src/js/delegate.js',
    'src/js/core.js',
    'src/js/end.js'
]

gulp.task('js', function() {
    gulp.src(concatArr)
        .pipe(concat('more-editor.js'))
        .pipe(gulp.dest('dist/js'))
})

gulp.task('css', function() {
    gulp.src('src/sass/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
        browsers:['last 10 versions', '> 5%']
    }))
    .pipe(gulp.dest('dist/css'))
})


gulp.task('default', ['js','css'], function() {
    gulp.watch(concatArr, ['js'])
    gulp.watch('src/sass/*.scss', ['css'])
})





