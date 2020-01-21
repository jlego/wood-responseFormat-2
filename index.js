/**
 * Wood Plugin Module.
 * 格式化输出结果中间件
 * by guohualin on 2019-04-02
 */
const zlib = require('zlib');

module.exports = (app = {}, config = {}) => {
  let respData = function(data, reqData){
    let status = 0, msg = '';
    const { seqno, verifycode, cmd, version } = reqData;
    if (!data && data !== false) data = app.config.errorCode.error_nodata;
    if (data.path && data.message && data.kind) { //返回错误
      status = app.config.errorCode.error.code;
      msg = app.config.errorCode.error.msg;
    } else {
      status = !data.code ? app.config.errorCode.success.code : data.code;
      msg = !data.msg ? app.config.errorCode.success.msg : data.msg;
    }
    return {
      status,
      msg,
      data: !data.code ? data : {},
      seqno, 
      verifycode, 
      cmd, 
      version
    };
  };

  app.responseFormat = function(req, res, next) {
    res.print = function(data){
      let body = {};
      if(req.method == 'GET'){
        body = req.query;
      }else{
        body = req.body;
      }
      let result = {};
      if (!data) {
        result = respData(data, body)
      } else {
        result = respData(data.err ? app.error(data.err) : (data.hasOwnProperty('data') ? data.data : data), body);
      }
      
      let resultStr = JSON.stringify(result);
      // 压缩结果
      res.statusCode = 200;
      if (resultStr.length > 1000) {
        resultStr = zlib.gzipSync(resultStr);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Connection', 'close');
        res.setHeader('Content-Encoding', 'gzip');
        res.end(resultStr);
      } else {
        res.json(result);
      }
    };
    next();
  };
  app.application.use(app.responseFormat);
  return app;
}
