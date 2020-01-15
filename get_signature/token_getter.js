'use strict'

const config = require('./config')
const rp = require('request-promise')
const database = require('scf-nodejs-serverlessdb-sdk').database//cynosDB数据库

function isValidAccessToken(data) {
    //检测传入的参数是否是有效的
    if (!data && !data.access_token && !data.expires_in) {
        //代表access_token无效的
        return false
    }

    return data.expires_in > Date.now()

}

async function saveAccessToken(data) {
    const connection = await database().connection()
    const createVlookTable = 'create table if not exists vlook_table(id int primary key auto_increment,name varchar(255) not null,value  varchar(255) not null,expires_in bigint)'
    await connection.queryAsync(createVlookTable)
    //存在就更新（或不做任何动作），不存在就添加
    const dbData = await connection.queryAsync('select * from vlook_table where name = "access_token"')
    if (dbData.length == 0) {
        const s = 'insert into vlook_table(name,value,expires_in) values ("access_token", "' + data.access_token + '",' + data.expires_in + ')'
        console.log("addAccessToken===", s)
        const result = await connection.queryAsync(s)
        console.log("addAccessToken result===", result)
    } else {
        const s = 'update vlook_table set value = "' + data.access_token + '", expires_in = ' + data.expires_in + ' where name = "access_token"'
        console.log("updateAccessToken===", s)
        const result = await connection.queryAsync(s)
        console.log("updateAccessToken result===", result)
    }
    // connection.close()
}

exports.get_access_token = async function () {
    const connection = await database().connection()
    const queryExist = 'select table_name from information_schema.tables where table_name = "vlook_table"'
    let result = await connection.queryAsync(queryExist)//表是否存在


    if (result.length > 0) {
        const data = await connection.queryAsync('select * from vlook_table where name = "access_token"')
        console.log("data[0]===", data[0])
        if (data[0]) {
            const dbres = {
                access_token: data[0].value,
                expires_in: data[0].expires_in
            }
            console.log("access_token dbres ===", dbres)
            if (isValidAccessToken(dbres)) {
                console.log("isValidAccessToken===", dbres)
                // connection.close()
                return dbres
            }
        }
    }

    const appID = config.weixin.AppId
    const appSecret = config.weixin.AppSecret
    //定义请求的地址
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appID}&secret=${appSecret}`
    //发送请求
    /*
      request
      request-promise-native  返回值是一个promise对象
     */
    return new Promise((resolve, reject) => {
        rp({method: 'GET', url, json: true})
            .then(async res => {
                console.log("res===", res)
                /*
                { access_token: '13_DGddvcTZ4HPm8tjcHGwnDAtk9LbNQMA_h_D3ffxcncMsJwGgfCUaLChd_pPjHb4ilxeyOr8adZ9iOv14unJyK7q4qPYO8ekPPCuXvMDu-t9hBURiwKWriNuP4HzvEVNQ2JoATXwCGrOwqwjgKJUaABAXWH',
                  expires_in: 7200 }
                 */
                //设置access_token的过期时间
                res.expires_in = Date.now() + (res.expires_in - 300) * 1000
                await saveAccessToken(res)
                //将promise对象状态改成成功的状态
                resolve(res)
            })
            .catch(err => {
                console.log("error===", err)
                //将promise对象状态改成失败的状态
                reject('getAccessToken方法出了问题：' + err)
            })
    })
}
