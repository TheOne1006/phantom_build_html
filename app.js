var express = require('express'),
  phantom = require('phantom'),
  async = require('async'),
  mkdirp = require('mkdirp'),
  fs = require('fs'),
  app = express();

var config = {
  'cachedir' : './_cache',
  'domain' : 'http://www.theone.io',
  'expiretime' : '360000'
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

/**
 * tmp hooks
 */
app.use(function(req, res, next){
  
  if(req.url === '/robots.txt'){
    res.write("User-agent: *\n");
    res.write("Disallow: /public/\n");
    res.write("Disallow: /angular/\n");
    res.end();
  }else{
    next();
  }

});

app.use(function(req, res){
  // res.end('hello world');
  var filePath = getFilePath(req.url),
  jsAndCssMatch = /.+(\.css)|(\.js)|(\.svg)/g;

  if(req.url.match(jsAndCssMatch)){
    res.redirect(config.domain + req.url);
    return;
  }

  async.waterfall([function(cb){
    fs.exists(filePath, function (exists) {
      if(exists) {

        var stat = fs.statSync(filePath),
          modifyTime = stat.mtime.getTime(),
          nowTime = Date.now();

          if( nowTime - modifyTime > config.expiretime * 1000 ) {
            // console.log(stat);
            // console.log('更新');
            saveHtml(req.url, cb);
          } else {
            fs.readFile(filePath, function (err, data) {
              if (err) throw err;
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
  jsAndHtmlCssMatch = /.+(\.html)|(\.css)|(\.js)|(\.svg)/g;

  if(url.match(jsAndHtmlCssMatch)) {
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
                  result = replace_url_by_css(result);
                    // console.log(result);
                    // 建立缓存
                    getFullDir(url, function(){
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
  var urlArr = (config.cachedir + url).split('/');
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
  str=str.replace("/public/",config.domain+"/public/");
  return str;
}

app.listen(3003);