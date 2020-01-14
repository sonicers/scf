'use strict'

// 云函数入口文件

const ticket_getter = require('./ticket_getter.js')
const cloud = require('wx-server-sdk')
var sign = require('./sign.js')

cloud.init()

// 云函数入口函数
/**
 * 拉取微信access_token
 */
exports.main_handler = async (event, context) => {
    console.log("event==========", event)
    console.log("queryString====", event.queryString)
    const data = await ticket_getter.get_ticket()
    console.log("data", data.ticket)
    // const ret = sign(data.ticket, "https://uss.sonicers.com/mouse/index.html")//测试
    const ret = sign(data.ticket, event.queryString)
    console.log("ret==========", ret)
    return ret
}
