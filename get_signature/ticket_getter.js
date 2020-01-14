'use strict'

const token_getter = require('./token_getter.js')
const rp = require('request-promise')
const database = require('scf-nodejs-serverlessdb-sdk').database//cynosDB数据库


function isValidTicket(data) {
    //检测传入的参数是否是有效的
    if (!data && !data.ticket && !data.expires_in) {
      //代表access_token无效的
      return false
    }
    
    return data.expires_in > Date.now()
  
}

async function saveTicket (data) {
    console.log("saveTicket=======")
    const connection = await database().connection()
    console.log("connection ===", connection)
    const createVlookTable = 'create table if not exists vlook_table(id int primary key auto_increment,name varchar(255) not null,value  varchar(255) not null,expires_in bigint)'
    const result = await connection.queryAsync(createVlookTable)
    console.log("create table===", result)
    const dbData = await connection.queryAsync('select * from vlook_table where name = "ticket"')
    console.log("saveTicket dbData===", dbData)
    if(dbData.length==0){
        const s = 'insert into vlook_table(name,value,expires_in) values ("ticket", "'+ data.ticket + '",' + data.expires_in + ')'
        console.log("addTicket===", s)
        const result = await connection.queryAsync(s)
        console.log("addTicket result===", result)
    }else{
        const s = 'update vlook_table set value = "' + data.ticket + '", expires_in = '+ data.expires_in + ' where name = "ticket"'
        console.log("updateTicket===", s)
        const result = await connection.queryAsync(s)
        console.log("updateTicket result===", result)
    }
}

exports.get_ticket = async function () {

    let connection = await database().connection()
    const queryExist = 'select table_name from information_schema.tables where table_name = "vlook_table"'
    let result = await connection.queryAsync(queryExist)//表是否存在
   

    if(result.length>0){
        const data = await connection.queryAsync('select * from vlook_table where name = "ticket"')
        console.log("data[0]===", data[0])
        if(data[0]){
            const dbres = {
                ticket: data[0].value,
                expires_in: data[0].expires_in
            }
            console.log("ticket dbres ===", dbres)
            if(isValidTicket(dbres)){
                console.log("isValidTicket===", dbres)
                return dbres
            }    
        }
    }

    const data = await token_getter.get_access_token()

    const token = data.access_token
    console.log("token==", token)
    //定义请求的地址
    const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`
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
                res.expires_in = Date.now() + (res.expires_in - 300) * 1000
                saveTicket(res)
                resolve(res)
            })
            .catch(err => {
                console.log(err)
                //将promise对象状态改成失败的状态
                reject('getTicket方法出了问题：' + err)
            })
    })
}