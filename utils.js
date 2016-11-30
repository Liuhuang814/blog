exports.md5 = function (inputStr) {
   //md5 算法是不可逆加密算法1
    return require('crypto').createHash('md5').update(inputStr).digest('hex');
    
}