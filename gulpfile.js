var gulp = require('gulp');
var watchify = require('gulp-watchify');
//var browserify = require('gulp-browserify');
var watch = require('gulp-watch');
var path = require('path');
var conf = require('./config.json');

var workspace = conf.workspace;

var destDir = path.join(workspace, conf.dest);
var excludeReg = /^!.*/;
var srcArr = conf.src.map(function(item) {
    if (excludeReg.test(item)) {
        return path.join('!', workspace, item.substr(1));
    }
    return path.join(workspace, item);
});
var watching = true;
gulp.task('default', watchify(function(watchify) {
    return gulp.src(srcArr)
        .pipe(watchify({
            watch:watching
        }))
        .pipe(gulp.dest(destDir))
}))
