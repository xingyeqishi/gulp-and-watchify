var gulp = require('gulp');
var browserify2 = require('gulp-browserify');
var browserify = require('browserify');
var transform = require('vinyl-transform');
var map = require('map-stream');
var source = require('vinyl-source-stream');
var gutil = require('gulp-util');
var clean = require('gulp-clean');
var filter = require('gulp-filter');
var watch = require('gulp-watch');
var path = require('path');
var fs = require('vinyl-fs');
var tap = require('gulp-tap');
var handlebars = require('gulp-handlebars');

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
var browserified = transform(function(filename) {
    return browserify(filename).bundle();
  });
// 生成当前已有文件的browserify目标文件
gulp.task('browserify', function() {
    return fs.src(srcArr)
        .pipe(browserified)
        .on('error', gutil.log)
        .pipe(gulp.dest(destDir))
        .on('error', gutil.log);
});
// 封装模板目标文件
var wrapHBS = function(file) {
    var tmplName = path.basename(file.path, '.js');
    file.contents = Buffer.concat([
        new Buffer('(function() {var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {}; templates["' + tmplName  +'"] = template('),
        file.contents,
        new Buffer('); })();')
    ]);
}
// 生成目标模板文件
gulp.task('handlebars', function() {
    var tmplName;
    return gulp.src('**/*.handlebars', {cwd: workspace})
        .pipe(handlebars())
        .pipe(tap(wrapHBS))
        .pipe(gulp.dest(workspace))
        .on('error', gutil.log);
});
// 检测文件修改，生成browserify目标文件
gulp.task('default', ['handlebars', 'browserify'], function() {
    // 监听js文件
    fs.watch(srcArr, function(files) {
        var a = path.relative(cwd, files.path);
        var b = path.relative(workspace, a);
        var c = path.dirname(b);
        if (files.type === 'changed' || files.type === 'added') {
            gulp.src(path.relative(cwd, files.path))
            .pipe(browserify2({debug: true}))
            .on('error', gutil.log)
            .pipe(gulp.dest(path.join(destDir, c) ))
            .on('error', gutil.log);
        } else if (files.type === 'deleted') {
            gulp.src(path.join(destDir, b)).pipe(clean({force: true}))
            .on('error', gutil.log);
        }
    });
    // 监听模板文件
    fs.watch('**/*.handlebars', {cwd: workspace}, function(files) {
        var a = path.relative(cwd, files.path);
        var b = path.relative(workspace, a);
        var c = path.dirname(b);
        if (files.type === 'changed' || files.type === 'added') {
            gulp.src(path.relative(cwd, files.path))
            .pipe(handlebars())
            .pipe(tap(wrapHBS))
            .pipe(gulp.dest(path.join(workspace, c) ))
            .on('error', gutil.log);
        } else if (files.type === 'deleted') {
            var hbsFile = path.join(c, path.basename(b, '.handlebars') + '.js');
            gulp.src(hbsFile, {cwd: workspace}).pipe(clean({force: true}))
            .on('error', gutil.log);
        }
    });
});
