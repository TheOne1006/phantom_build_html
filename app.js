'use strict';

var express = require('express'),
  phantom = require('phantom'),
  async = require('async'),
  mkdirp = require('mkdirp'),
  http = require('http'),
  fs = require('fs'),
  app = express(),
  Download = require('download');

var config = {
  'cachedir' : './_cache',
  'domain' : 'http://www.theone.io',
  'expiretime' : '3600',
  'staticPath' : './static'
};

// app.get('/', function (req, res) {
//   res.send('Hello World');
// });
var fileHooks = {
  '/':'/index',
  '/cate/js/':'/cate/js/1',
  '/cate/devtool/':'/cate/devtool/1',
  '/cate/node/':'/cate/node/1',
  '/cate/ng/':'/cate/ng/1',
  '/cate/css/':'/cate/css/1',
  '/cate/php/':'/cate/php/1',
  '/cate/mysql/':'/cate/mysql/1',
  '/cate/jq/':'/cate/jq/1',
  '/cate/html/':'/cate/html/1'
};

var saveStaticPaths = [
  '/public/scripts/home/:file',
  '/public/components/bootstrap-sass-official/assets/fonts/bootstrap/:file',
  '/public/css/home/:file',
  '/public/svg/:file'
  // '/angular/scripts/home/' //加载后报错
];


app.use(express.static(config.staticPath));


/**
 * 下载文件如果不存在, 则下载
 */
app.get(saveStaticPaths,function(req,res){
  var filePath = req.url;

  // 遍历创建目录
  getFullDir(config.staticPath+filePath, function(){
    // 下载
    download(config.domain+filePath, function (staticData) {

      // fs.writeFile(config.staticPath+filePath, staticData);
       var urlArr = filePath.split('/');
          urlArr.pop();
        var distPath = urlArr.join('/');

      new Download({mode: '755'})
        .get(config.domain+filePath)
        .dest(config.staticPath+distPath)
        .run(function () {
          res.end(staticData);
        });
    });
  });

});

app.use(function(req, res){
  // res.end('hello world');
  var filePath = getFilePath(req.url);

  async.waterfall([function(cb){
    fs.exists(filePath, function (exists) {
      if(exists) {

        var stat = fs.statSync(filePath),
          modifyTime = stat.mtime.getTime(),
          nowTime = Date.now();

          // 过期
          if( nowTime - modifyTime > config.expiretime * 1000 ) {
            // console.log(stat);
            // console.log('更新');
            saveHtml(req.url, cb);
          } else {
            // 未过期,读取文件
            fs.readFile(filePath, function (err, data) {
              if (err) {
                return;
              }

              cb(null, data);
            });
          }
      } else {
        saveHtml(req.url, cb);
      }
    });
  }],function(err, result){
    res.end(result);
  });

});



function saveHtml(url, next){
  var openUrl = config.domain + url,
  statusFileMatch = /.+(\.html)|(\.css)|(\.js)|(\.svg)/g;

  if(url.match(statusFileMatch)) {
    console.log(url);
    return next();
  }

  console.log(openUrl);

  phantom.create(function (ph) {
    ph.createPage(function (page) {
        page.open(openUrl, function (status) {
            setTimeout(function () {
                page.evaluate(function () {
                    return document.all[0].outerHTML;
                }, function (result) {
                    // 替换css 路径
                    // result = replace_url_by_css(result);

                    // console.log(result);
                    // 建立缓存
                    var saveUrl = config.cachedir + url;
                    getFullDir(saveUrl, function(){
                      fs.writeFile(getFilePath(url), result);
                      ph.exit();
                      next(null, result);
                    });
                });
            }, 200);
        });
    });
  }, {
    dnodeOpts: {
      weak: false
    }
  });
}

function getFilePath(url){
  return config.cachedir + (fileHooks[url] || url)+'.html';
}

function getFullDir(url, cb) {
  var urlArr = url.split('/');
  urlArr.pop();
  var dir = urlArr.join('/');
  console.log(dir);

  mkdirp(dir, function (err) {
      if (err) {
        console.error(err);
      }

      cb();
  });

}
/**
 * 替换网址
 * @return new string 
 */
function replace_url_by_css (str) {
  str=str.replace('/public/css/home/',config.domain+'/public/css/home/');
  return str;
}

/**
 * 下载
 */
function download(url, cb) {
 var data = '';
 var request = http.get(url, function(res) {

   res.on('data', function(chunk) {
     data += chunk;
   });

   res.on('end', function() {
     cb(data);
   });
 });

 request.on('error', function(e) {
   console.log('Got error: ' + e.message);
 });
}

app.listen(3003);