//清除公司账号登录信息--2015/1/15
db.companies.update({},{$set:{device:[]},$unset:{token_device:1,app_token:1}},{multi:true})
//给举报信息增加hr处理标志
db.reports.update({hr_status:{$exists:false}},{$set:{hr_status:'verifying'}},{multi:true})