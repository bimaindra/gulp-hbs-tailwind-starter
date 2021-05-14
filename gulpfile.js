/**
*   Gulp StarterKit with Handlebars & TailwindCSS            
*   Author : bimaindra                                          
*   URL : bimaindra.com                                          
**/

//--- GENERAL
const { series, parallel, src, dest, watch } = require('gulp');
const path = require('path');
const del = require('del');
const logSymbols = require('log-symbols');
const browserSync = require('browser-sync').create();
const handlebars = require('gulp-handlebars');
const wrap = require('gulp-wrap');
const declare = require('gulp-declare');
const concat = require('gulp-concat');
const merge = require('merge-stream');
const noop = require("gulp-noop");
const sourcemaps = require('gulp-sourcemaps');

//--- JS
const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const replace = require('rollup-plugin-replace');

//--- CSS
const sass = require('gulp-sass'); //-- if needed
const postcss = require('gulp-postcss');
const postcssimport = require('postcss-import');
const postcssnested = require('postcss-nested');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const cleanCss = require('gulp-clean-css');

//--- CONFIG
const tailwindConfig = require('./tailwind.config');


//--- ENV
const isDebug = ((process.env.NODE_ENV || 'development').trim().toLowerCase() !== 'production');


//--- DIRECTORY MAPPING
const root = {
    src: './src',
    build: './build',
    assets: './src/assets',
    npm: './node_modules',
};

const dir = {
    source: {
        public: `${root.src}/public`,
        css: `${root.assets}/css`,
        scss: `${root.assets}/scss`,
        js: `${root.assets}/js`,
        images: `${root.assets}/images`,
        fonts: `${root.assets}/fonts`,
    },
    build: {
        base: `${root.build}`,
        css: `${root.build}/assets/css`,
        js: `${root.build}/assets/js`,
        images: `${root.build}/assets/images`,
        fonts: `${root.build}/assets/fonts`,
    },
};

//--- BROWSER-SYNC INIT
function browserInit(done) {
    browserSync.init({
        server: {
            baseDir: dir.build.base,
        },
    });

    done();
};

//--- BROWSER-SYNC RELOAD
function browserReload(done) {
    console.log(logSymbols.info,'Reloading BrowserSync...');
    browserSync.reload();

    done();
};

//-- CLEANUP BUILD FOLDER
function cleanBuild() {
    console.log(logSymbols.info,'Clean up build folder...');
    return del([root.build]);
};

//-- FINISHED COMPILE MESSAGE
function finishedCompileMessage(done) {
    console.log(logSymbols.success,'Finished compiling!');
    done();
};

//--- COMPILE HBS TEMPLATE
function hbsCompile() {
    // Assume all partials start with an underscore
    // You could also put them in a folder such as source/templates/partials/*.hbs
    let partials = src([`${dir.source.public}/partials/**/*.hbs`])
        .pipe(handlebars())
        .pipe(wrap('Handlebars.registerPartial(<%= processPartialName(file.relative) %>, Handlebars.template(<%= contents %>));', {}, {
            imports: {
                processPartialName: function(fileName) {
                    // Strip the extension and the underscore
                    // Escape the output with JSON.stringify
                    return JSON.stringify(path.basename(fileName, '.js').substr(1));
                }
            }
        }));
  
    let templates = src(`${dir.source.public}/templates/**/*.hbs`)
        .pipe(handlebars())
        .pipe(wrap('Handlebars.template(<%= contents %>)'))
        .pipe(declare({
            namespace: 'MyApp.templates',
            noRedeclare: true // Avoid duplicate declarations
        }));
  
    // Output both the partials and the templates as build/js/templates.js
    return merge(partials, templates)
        .pipe(concat('templates.js'))
        .pipe(dest(dir.build.js));
};

//--- COMPILE CSS
function cssCompile() {
    return src(`${dir.source.css}/*.css`)
        .pipe(!isDebug ? noop() : sourcemaps.init())
        .pipe(postcss([
            postcssimport,
            tailwindcss(tailwindConfig),
            postcssnested,
            autoprefixer,
        ]))
        .pipe(concat({ path: 'style.css'}))
        .pipe(isDebug ? noop() : cleanCss({compatibility: 'ie8'}))
        .pipe(!isDebug ? noop() : sourcemaps.write('./maps'))
        .pipe(dest(dir.build.css));
};

//--- COMPILE JS
function jsCompile() {
    return rollup.rollup({
        input: `${dir.source.js}/main.js`,
        plugins: [
            babel({
                exclude: 'node_modules/**'
            }),
            commonjs(),
            replace({
                'process.env.NODE_ENV': JSON.stringify('production')
            }),
            resolve(),
        ]
    }).then(bundle => {
        return bundle.write({
            file: `${dir.build.js}/main.js`,
            format: 'es',
            sourcemap: isDebug ? true : false
        })
    })
};

//--- COPY JS HBS RUNTIME
function hbsRuntime() {
    return src(`${root.npm}/handlebars/dist/handlebars.runtime.js`)
        .pipe(dest(dir.build.js));
};

// COPY IMAGES
function imagesCopy() {
    return src(`${dir.source.images}/**/*`).pipe(dest(dir.build.images));
}

//--- COPY HTML
function htmlCopy() {
    return src(`${dir.source.public}/pages/*.html`)
        .pipe(dest(dir.build.base));
};

//--- WATCHING FILES CHANGES
function watchFiles() {
    watch(`${dir.source.css}/**/*.css`, series(parallel(cssCompile), finishedCompileMessage, browserReload));
    watch(`${dir.source.js}/**/*.js`, series(parallel(jsCompile), finishedCompileMessage, browserReload));
    watch(`${dir.source.images}/**/*`, series(parallel(imagesCopy), finishedCompileMessage, browserReload));
    watch(`${dir.source.public}/pages/*.html`, series(parallel(cssCompile, htmlCopy), finishedCompileMessage, browserReload));
    watch(`${dir.source.public}/**/*.hbs`, series(parallel(cssCompile), hbsCompile, finishedCompileMessage, browserReload));
    console.log("\t" + logSymbols.info,"Watching for changes...");
};

//--- COMPILE FILES
exports.build = series(
    cleanBuild, 
    parallel(
        cssCompile, 
        jsCompile,
        imagesCopy,
        hbsRuntime,
        htmlCopy,
    ),
    hbsCompile,
    finishedCompileMessage
);

//--- DEFAULT TASK
exports.default = isDebug ? series(this.build, browserInit, watchFiles) : series(this.build);