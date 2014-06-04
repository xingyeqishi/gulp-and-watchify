var gulp = require('gulp');
var browserify = require('gulp-browserify');
var gutil = require('gulp-util');
var clean = require('gulp-clean');
var filter = require('gulp-filter');
var watch = require('gulp-watch');
var path = require('path');
var fs = require('vinyl-fs');

var conf = require('./config.json');

var workspace = conf.workspace;
var cwd = process.cwd();
workspace = path.relative(cwd, workspace);

var destDir = path.join(workspace, conf.dest);
var excludeReg = /^!.*/;

// 调整文件地址为相对当前目录
var srcArr = conf.src.map(function(item) {
    if (excludeReg.test(item)) {
        return '!' + path.join(workspace, item.substr(1));
    }
    return path.join(workspace, item);
});

// 删除功能目前还不支持
function isAddedOrChanged(file) {
    return file.event === 'added' || file.event === 'changed';
}
// 生成当前已有文件的browserify目标文件
gulp.task('browserify', function() {

    return fs.src(srcArr)
        .pipe(browserify())
        .pipe(gulp.dest(destDir))
        .on('error', gutil.log);
});
// 检测文件修改，生成browserify目标文件
gulp.task('default', ['browserify'], function() {
    fs.watch(srcArr, function(files) {
        var a = path.relative(cwd, files.path);
        var b = path.relative(workspace, a);
        var c = path.dirname(b);
        if (files.type === 'changed' || files.type === 'added') {
            gulp.src(path.relative(cwd, files.path))
            .pipe(browserify())
            .pipe(gulp.dest(path.join(destDir, c) ))
            .on('error', gutil.log);
        } else if (files.type === 'deleted') {
            gulp.src(path.join(destDir, b)).pipe(clean({force: true}))
            .on('error', gutil.log);
        }
    });
});
