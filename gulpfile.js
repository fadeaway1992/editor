/* 
    使用 gulp 进行 js 的合并、scss 的编译。
    使用 browser-sync 进行热加载，实现多浏览器一同调试。
*/

var gulp = require('gulp')
var autoprefixer = require('gulp-autoprefixer')
var sass = require('gulp-sass')
var concat = require('gulp-concat')
var browserSync = require('browser-sync').create()


/* 
  将 /src 目录下的 JavaScript 文件按照下列顺序进行合并
*/
var concatArr = [
    'src/js/start.js',
    'src/js/globals.js',
    'src/js/util.js',
    'src/js/selection.js',
    'src/js/events.js',
    'src/js/delegate.js',
    'src/js/API.js',
    'src/js/fileDragging.js',
    'src/js/paste.js',
    'src/js/undo.js',
    'src/js/autoLink.js',
    'src/js/core.js',
    'src/js/end.js'
]

/* 
  注册 js 任务，按照指定顺序将 ／src 下的 JavaScript 文件合并为 /dist/js 下的 more-editor.js 文件
*/
gulp.task('js', function() {
    gulp.src(concatArr)
        .pipe(concat('more-editor.js'))
        .pipe(gulp.dest('dist/js'))
})

/* 
  注册 js-watch 任务， 更新 more-editor.js 文件并刷新浏览器
*/
gulp.task('js-watch', ['js'], function() {
    browserSync.reload()
})

/* 
  注册 css 任务，将 src/sass 下的所有 sass 文件转译为 css 文件放到 dist/css 下
*/
gulp.task('css', function() {
    gulp.src('src/sass/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
        browsers:['last 10 versions', '> 5%']
    }))
    .pipe(gulp.dest('dist/css'))
    .pipe(browserSync.stream())
})

/* 
  gulp 默认任务，在 /dist 下启动 browserSync 服务器，端口设置为 3000， 主页为 /dist/demo/index.html 
  并监听 src/*.js src/sass/*.sass 实时更新。 
*/
gulp.task('default', ['js','css'], function() {
     
    browserSync.init({
        server: {
            baseDir: "./dist/",
            index: "demo/index.html"
        },
        port: 3000,
        ui: {
            port: 3001
        }
    })

    gulp.watch(concatArr, ['js-watch'])
    gulp.watch('src/sass/*.scss', ['css'])
})





