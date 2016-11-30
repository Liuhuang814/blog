/**
 * Created by maggie on 16/11/18.
 */
//autoauth.js


exports.checkLogin=function (req,res,next) {
    if(req.session.user)
    {
        next();
    }else
    {
        res.redirect('/users/login');
    }

}

//检查用户没登录的

exports.checkNotLogin=function (req,res,next) {
    if(req.session.user)
    {
        res.redirect("/");
    }else
    {
       next();
    }

}