'use strict';

const token_getter = require('./token_getter.js');
const rp = require('request-promise')
const database = require('scf-nodejs-serverlessdb-sdk').database;//cynosDB数据库


function isValidTicket(data) {
    //检测传入的参数是否是有效的
    if (!data && !data.ticket && !data.expires_in) {
      //代表access_token无效的
      return false;
    }
    
    return data.expires_in > Date.now();
  
}

function saveTicker (data) {
    
}

exports.get_ticket = async function () {

    const data = await token_getter.get_access_token()

    const token = data.access_token
    console.log("token==", token)
    //定义请求的地址
    const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`;
    //发送请求
    /*
      request
      request-promise-native  返回值是一个promise对象
     */
    //发送请求
    return new Promise(async (resolve, reject) => {
        console.log("url==", url)
        rp({method: 'GET', url, json: true})
            .then(res => {
                console.log("get_ticket res===", res)
                //将promise对象状态改成成功的状态
                resolve({
                    ticket: res.ticket,
                    expires_in: Date.now() + (res.expires_in - 300) * 1000
                });
            })
            .catch(err => {
                console.log(err);
                //将promise对象状态改成失败的状态
                reject('getTicket方法出了问题：' + err);
            })
    })
};