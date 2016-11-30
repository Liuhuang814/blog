var express = require('express');
var models = require("../db/model");
//加载express的路由模块
var router = express.Router();
var markdown = require('markdown').markdown;
/* 指向首页*/
router.get('/',function(req, res, next){
  models.Article.find({}).populate('user').exec(function(err,articles) {
    articles.forEach(function (article) {
      article.content = markdown.toHTML(article.content);
    });
    res.redirect('/article/list/1/6');
    res.render('index', { title: '文刂火皇博客',articles:articles});
  })

});


module.exports = router;
