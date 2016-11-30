/**
 * Created by maggie on 16/11/16.
 */
var express = require('express');
var models = require("../db/model");
var utils = require('../utils');
var auth = require('../middleware/autoauth');
var markdown = require('markdown').markdown;
var multer = require('multer');
var router = express.Router();
var path = require('path');
var async = require('async');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'E:\\zkin-blog\\zkingblog\\public\\img')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now()+'.'+file.mimetype.slice(file.mimetype.indexOf('/')+1))
    }
});
var upload = multer({ storage:storage});
/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

// 添加文章  http://127.0.0.1:3000/article/add
router.get('/post',auth.checkLogin, function (req, res, next) {
    res.render('articles/post.html', {title: '发布文章',article:'article'});
});

router.post('/comment',auth.checkLogin, function (req,res) {
    var user = req.session.user;
    models.Article.update({_id:req.body._id},{$push:{comments:{user:user._id,content:req.body.content}}},function(err,result){
        if(err){
            req.flash('error',err);
            return res.redirect('back');
        }
        req.flash('success','评论成功!');
        res.redirect('back');
    });
});

router.post('/post',auth.checkLogin,upload.single('img'), function (req, res) {
    if(req.file){
        req.body.img = path.join('/img',req.file.filename);
    }
    var _id = req.body._id;
    if(_id){
        var set = {title:req.body.title,content:req.body.content};
        if(req.file)
            set.img = req.body.img;
        models.Article.update({_id:_id},{$set:set},function(err,result){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash('success', '更新文章成功!');
            res.redirect('/');//注册成功后返回主页
        });
    }else{
        req.body.user = req.session.user._id;
        new models.Article(req.body).save(function(err,article){
            if(err){
                req.flash('error',err);
                return res.redirect('/article/post');
            }
            req.flash('success', '发表文章成功!');
            res.redirect('/');//注册成功后返回主页
        });
    }
});





//查看文章的路由
router.get('/detail/:_id', function (req, res) {
    async.parallel([function(callback){
        models.Article.findOne({_id:req.params._id}).populate('user').populate('comments.user').exec(function(err,article){
            article.content = markdown.toHTML(article.content);
            callback(err,article);
        });
    },function(callback){
        models.Article.update({_id:req.params._id},{$inc:{pv:1}},callback);
    }],function(err,result){
        if(err){
            req.flash('error',err);
            res.redirect('back');
        }
        res.render('articles/detail.html',{title:'查看文章',article:result[0]});
    });
});
router.get('/delete/:_id', function (req, res) {
    models.Article.remove({_id:req.params._id},function(err,result){
        if(err){
            req.flash('error',err);
            res.redirect('back');
        }
        req.flash('success', '删除文章成功!');
        res.redirect('/');//注册成功后返回主页
    });
});
router.get('/edit/:_id', function (req, res) {
    models.Article.findOne({_id:req.params._id},function(err,article){
        res.render('articles/post.html',{title:'编辑文章',article:article});
    });
});
router.all('/list/:pageNum/:pageSize',function(req, res, next) {
    var pageNum = req.params.pageNum&&req.params.pageNum>0?parseInt(req.params.pageNum):1;
    var pageSize =req.params.pageSize&&req.params.pageSize>0?parseInt(req.params.pageSize):6;
    var query = {};
    var searchBtn = req.query.searchBtn;
    var keyword = req.query.keyword;
    if(searchBtn){
        req.session.keyword = keyword;
    }
    if(req.session.keyword){
        query['title'] = new RegExp(req.session.keyword,"i");
    }

    models.Article.count(query,function(err,count){
        models.Article.find(query).sort({createAt:-1}).skip((pageNum-1)*pageSize).limit(pageSize).populate('user').exec(function(err,articles){
            articles.forEach(function (article) {
                article.content = markdown.toHTML(article.content);
            });
            res.render('index',{
                title:'主页',
                pageNum:pageNum,
                pageSize:pageSize,
                keyword:req.session.keyword,
                totalPage:Math.ceil(count/pageSize),
                articles:articles
            });
        });
    });
});
module.exports = router;