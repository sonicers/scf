'use strict'

// 云函数入口函数
/**
 * 拉取微信access_token
 */
exports.main_handler = async (event, context) => {
    console.log("event==========", event)
    return "world"
}
