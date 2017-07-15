var gulp = require('gulp')
var autoprefixer = require('gulp-autoprefixer')
var sass = require('gulp-sass')
var concat = require('gulp-concat')

var concatArr = [
    'src/js/start.js',
    'src/js/globals.js',
    'src/js/util.js',
    'src/js/selection.js',
    'src/js/core.js',
    'src/js/end.js'
]

// gulp.task('css', function() {
//     gulp.src('src/sass/*.scss')
//     .pipe(sass().on('error', sass.logError))
//     .pipe(autoprefixer({
//         browsers:['last 10 versions', '> 5%']
//     }))
//     .pipe(gulp.dest('dist/css'))
// })

// var cssWatcher = gulp.watch('src/sass/*.scss', ['css'])

// cssWatcher.on('change', function() {
//     console.log('侦听到 css 改动，重新启动 gulp')
// })


gulp.task('default', ['js'], function() {
    console.log('js tasks finished')
})

gulp.task('js', function() {
    gulp.src(concatArr)
        .pipe(concat('more-editor.js'))
        .pipe(gulp.dest('dist/js'))
})

gulp.task('jsWatch', ['js'], function() {
    gulp.watch(concatArr, ['js'])
})





