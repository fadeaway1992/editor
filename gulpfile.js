var gulp = require('gulp')
var autoprefixer = require('gulp-autoprefixer')
var sass = require('gulp-sass')

gulp.task('cssWorkFlow', function() {
    gulp.src('src/sass/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
        browsers:['last 10 versions', '> 5%']
    }))
    .pipe(gulp.dest('dist/css'))
})


gulp.task('default', ['cssWorkFlow'], function() {
    console.log('tasks finished')
})

var watcher = gulp.watch('src/sass/*.scss', ['default'])

watcher.on('change', function(event) {
    console.log('侦听到改动，重新启动 gulp')
})
