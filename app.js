var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var bodyParser = require('body-parser');
var config = require('./dbconfig');
var flash = require('connect-flash');

//加载路由文件  routes文件夹专门存放路由文件
//index实际上就是index.js文件中创建的router对象
var index = require('./routes/index');
var users = require('./routes/users');
var article = require('./routes/article');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
//设置ejs模板的后缀是html
app.set('view engine', 'html');
app.engine('html', require('ejs').__express);


//解析session
app.use(cookieParser());
app.use(session({
    secret: 'zkingblog',//加密cookie,防止cookie被篡改
    resave: true,//表示每次请求处理完毕后都更新session数据
    cookie: {maxAge: 4000 * 60 * 30},//设置session的有效时间是30分钟
    saveUninitialized: true,//保存新创建但是为初始化的session
    //把session的信息保存到数据库中
    store: new MongoStore({
        url: config.dburl
    })

}));

app.use(flash());


//由于需要给每个页面在渲染时传递session中保存的user对象,所以
//可以添加一个中间件,专门处理session的问题
app.use(function (req, resp, next) {
    resp.locals.myuser = req.session.user;
    resp.locals.success = req.flash('success');
    resp.locals.error = req.flash('error');
    next();
})


// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
//设置表单格式 需要两种格式   json 和 urlencoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
//加载解析cookie
app.use(cookieParser());
//设置静态目录
app.use(express.static(path.join(__dirname, 'public')));

//设置路由处理模块  所有访问"/"网站根目录的请求都由index路由模块处理
app.use('/', index);
//所有与用户user相关的操作请求都访问'/users'这个路径,并且交给users路由模块处理  /users      /users/reg    /users/login
app.use('/users', users);
//所有的路由处理全部模块化 所有访问相同资源的请求都由同一个路由模块处理
//符合了RESTful的设计原则

//负责处理文章的路由
app.use('/article', article);


// catch 404 and forward to error handler
//捕捉错误路由 生成错误对象
app.use(function (req, res, next) {
    var err = new Error('页面找不到');
    err.status = 404;
    //转到下一个中间件 做错误页面的渲染
    next(err);
});

// error handler 错误页面的渲染
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = (req.app.get('env') === 'development' ? err : {});

    // render the error page
    res.status(err.status || 500);
    console.log(err);
    //渲染错误页面
    res.render('error');
});

//把app暴露给外界
module.exports = app;
