'use strict';

//组件脚本
var _group =[
            {
                '_id':'0',
                'group_type':'虚拟组',
                'entity_type':'virtual',
                'icon':'default',
                'active':true,
                'group_rule':'default'
            },
            {
                '_id':'1',
                'group_type':'羽毛球',
                'entity_type':'Badminton',
                'icon':'default',
                'active':true,
                'group_rule':'default'
            },
            {
                '_id':'2',
                'group_type':'篮球',
                'entity_type':'BasketBall',
                'icon':'default',
                'active':true,
                'group_rule':'default'
            },
            {
                '_id':'3',
                'group_type':'阅读',
                'entity_type':'Reading',
                'icon':'default',
                'active':true,
                'group_rule':'default'
            },
            {
                '_id':'4',
                'group_type':'自行车',
                'entity_type':'Bicycle',
                'icon':'default',
                'active':true,
                'group_rule':'default'
            },
            {
                '_id':'5',
                'group_type':'台球',
                'entity_type':'TableTennis',
                'icon':'default',
                'active':true,
                'group_rule':'default'
            },
            {
                '_id':'6',
                'group_type':'钓鱼',
                'entity_type':'Fishing',
                'icon':'default',
                'active':true,
                'group_rule':'default'
            },
            {
                '_id':'7',
                'group_type':'足球',
                'entity_type':'FootBall',
                'icon':'default',
                'active':true,
                'group_rule':'default'
            },
            {
                '_id':'8',
                'group_type':'k歌',
                'entity_type':'KTV',
                'icon':'default',
                'active':true,
                'group_rule':'default'
            },
            {
                '_id':'9',
                'group_type':'户外',
                'entity_type':'OutDoor',
                'icon':'default',
                'active':true,
                'group_rule':'default'
            },
            {
                '_id':'10',
                'group_type':'乒乓球',
                'entity_type':'PingPong',
                'icon':'default',
                'active':true,
                'group_rule':'default'
            },
            {
                '_id':'11',
                'group_type':'跑步',
                'entity_type':'Running',
                'icon':'default',
                'active':true,
                'group_rule':'default'
            },
            {
                '_id':'12',
                'group_type':'游泳',
                'entity_type':'Swimming',
                'icon':'default',
                'active':true,
                'group_rule':'default'
            }
        ];
        try{
            db.groups.dropIndexes();
            _group.forEach(function (value) {
                db.groups.insert(value);
            });
        } catch (e){
            print(e);
        };



var _region = [{
    "__v" : 2,
    "_id" : ObjectId("53731162140754fe019189b5"),
    "city" : [
        {
            "_id" : ObjectId("5373116a140754fe019189b6"),
            "district" : [
                {
                    "id" : "C626229D-8A70-0001-C01A-1516270011CD",
                    "name" : "黄浦",
                    "_id" : ObjectId("53731175140754fe019189b7")
                }
            ],
            "id" : "C626229A-A370-0001-C11B-1CD0B030181A",
            "name" : "上海"
        }
    ],
    "id" : "C6262298-B770-0001-AEE9-42B07510B040",
    "name" : "上海"
}
];

try{
    _region.forEach(function (value) {
        db.regions.insert(value);
    });
} catch (e){
    print(e);
};
//公司脚本
var _company = [
    {
        '_id': '0001-0001-0001-0001-000100010001',
        'username': 'donler',
        'login_email': 'hr@55yali.com',
        'hashed_password': 'AMQEr5SljqggnlY9LTJR8ZrHMAnYRRNJLnbNU/PriiZNiTkk9hPqPHc3T21mPcNVUqUL7xX1bJJ8axkoyK0cXQ==',
        'salt': 'oGn/YzIa2UdFMCyju42JWA==',
        'email':{ "domain" : [  "55yali.com" ] },
        'status': {
            'active': true,
            'date': new Date().getTime()
        },
        'info': {
            'name': '上海动梨信息技术有限公司',
            'city': {
                'province': '上海',
                'city': '上海'
            },
            'address': '上海市',
            'phone': '18801910101',

            //固话
            'lindline': {
                'areacode': '021',         //区号
                'number': '66666666',           //号码
                'extension': '8888'         //分机
            },
            'linkman': '动力',              //联系人
            'email': 'hr@55yali.com',
            'brief': '我们是动力',
            'official_name': '上海动梨信息技术有限公司',
            'logo':'/img/icons/default_company_logo.png'
        },
        'register_date': new Date(),
        'provider': 'company',
        'group':[
            {
                "_id" : "7",
                "group_type" : "足球",
                "entity_type" : "FootBall",
                "tname":"上海动梨信息技术有限公司-足球队",
                "leader":[{
                    "_id":"0001-0001-0001-0001-000100010002",
                    "nickname":"eric"
                }]
            }
        ]
    },
    {
        '_id': '0002-0002-0002-0002-000200020002',
        'username': 'yali',
        'login_email': 'yali_hr@163.com',
        'hashed_password': 'AMQEr5SljqggnlY9LTJR8ZrHMAnYRRNJLnbNU/PriiZNiTkk9hPqPHc3T21mPcNVUqUL7xX1bJJ8axkoyK0cXQ==',
        'salt': 'oGn/YzIa2UdFMCyju42JWA==',
        'email':{ "domain" : [  "163.com" ] },
        'status': {
            'active': true,
            'date': new Date().getTime()
        },
        'info': {
            'name': '上海鸭梨信息技术有限公司',
            'city': {
                'province': '上海',
                'city': '上海'
            },
            'address': '上海市',
            'phone': '18801910101',

            //固话
            'lindline': {
                'areacode': '021',         //区号
                'number': '66666666',           //号码
                'extension': '8888'         //分机
            },
            'linkman': '鸭梨',              //联系人
            'email': 'yali_hr@163.com',
            'brief': '我们是鸭梨',
            'official_name': '上海鸭梨信息技术有限公司',
            'logo':'/img/icons/default_company_logo.png'
        },
        'register_date': new Date(),
        'provider': 'company',
        'group':[
            {
                "_id" : "7",
                "group_type" : "足球",
                "entity_type" : "FootBall",
                "tname":"上海鸭梨信息技术有限公司-足球队",
                "leader":[{
                    "_id":"0002-0002-0002-0002-000200020003",
                    "nickname":"yali_yg1"
                }]
            }
        ]
    },
    {
        '_id': '0003-0003-0003-0003-000300030003',
        'username': 'apple',
        'login_email': 'pingguo_hr@sina.com',
        'hashed_password': 'AMQEr5SljqggnlY9LTJR8ZrHMAnYRRNJLnbNU/PriiZNiTkk9hPqPHc3T21mPcNVUqUL7xX1bJJ8axkoyK0cXQ==',
        'salt': 'oGn/YzIa2UdFMCyju42JWA==',
        'email':{ "domain" : [  "sina.com" ] },
        'status': {
            'active': true,
            'date': new Date().getTime()
        },
        'info': {
            'name': '上海苹果信息技术有限公司',
            'city': {
                'province': '上海',
                'city': '上海'
            },
            'address': '上海市',
            'phone': '18801910101',

            //固话
            'lindline': {
                'areacode': '021',         //区号
                'number': '66666666',           //号码
                'extension': '8888'         //分机
            },
            'linkman': '苹果',              //联系人
            'email': 'pingguo_hr@sina.com',
            'brief': '我们是苹果',
            'official_name': '上海苹果信息技术有限公司',
            'logo':'/img/icons/default_company_logo.png'
        },
        'register_date': new Date(),
        'provider': 'company',
        'group':[
            {
                "_id" : "7",
                "group_type" : "足球",
                "entity_type" : "FootBall",
                "tname":"上海苹果信息技术有限公司-足球队",
                "leader":[{
                    "_id":"0003-0003-0003-0003-000300030004",
                    "nickname":"apple1"
                }]
            }
        ]
    },
    {
        '_id': '0004-0004-0004-0004-000400040004',
        'username': 'banana',
        'login_email': 'xiangjiao_hr@sohu.com',
        'hashed_password': 'AMQEr5SljqggnlY9LTJR8ZrHMAnYRRNJLnbNU/PriiZNiTkk9hPqPHc3T21mPcNVUqUL7xX1bJJ8axkoyK0cXQ==',
        'salt': 'oGn/YzIa2UdFMCyju42JWA==',
        'email':{ "domain" : [  "sohu.com" ] },
        'status': {
            'active': true,
            'date': new Date().getTime()
        },
        'info': {
            'name': '上海香蕉信息技术有限公司',
            'city': {
                'province': '上海',
                'city': '上海'
            },
            'address': '上海市',
            'phone': '18801910101',

            //固话
            'lindline': {
                'areacode': '021',         //区号
                'number': '66666666',           //号码
                'extension': '8888'         //分机
            },
            'linkman': '香蕉',              //联系人
            'email': 'xiangjiao_hr@sohu.com',
            'brief': '我们是香蕉',
            'official_name': '上海香蕉信息技术有限公司',
            'logo':'/img/icons/default_company_logo.png'
        },
        'register_date': new Date(),
        'provider': 'company',
        'group':[
            {
                "_id" : "7",
                "group_type" : "足球",
                "entity_type" : "FootBall",
                "tname":"上海香蕉信息技术有限公司-足球队",
                "leader":[{
                    "_id":"0004-0004-0004-0004-000400040006",
                    "nickname":"xiangjiao_yg2"
                }]
            }
        ]
    }
];
try{
    _company.forEach(function (value) {
        db.companies.insert(value);
    });
} catch (e){
    print(e);
};

//员工脚本
var _users =[
{
"active" : true,
"cid" : "0001-0001-0001-0001-000100010001",
"cname":"上海动梨信息技术有限公司",
"department" : "hr",
"email" : "eric@55yali.com",
"group" : [
    {
        "_id" : "7",
        "group_type" : "足球",
        "entity_type" : "FootBall",
        "tname":"上海动梨信息技术有限公司-足球队",
        "leader" : true
    },
    {
        "_id":"0"
    }
],
"hashed_password" : "AMQEr5SljqggnlY9LTJR8ZrHMAnYRRNJLnbNU/PriiZNiTkk9hPqPHc3T21mPcNVUqUL7xX1bJJ8axkoyK0cXQ==",
"_id" : "0001-0001-0001-0001-000100010002",
"nickname" : "eric",
"realname":"张三",
"phone" : "18801910251",
"photo" : "/img/icons/default_user_photo.png",
"provider" : "user",
"register_date" : new Date(),
"role" : "EMPLOYEE",
"salt" : "oGn/YzIa2UdFMCyju42JWA==",
"username" : "eric@55yali.com"
},
{
"active" : true,
"cid" : "0002-0002-0002-0002-000200020002",
"cname":"上海鸭梨信息技术有限公司",
"department" : "hr",
"email" : "yali_yg1@163.com",
"group" : [
    {
        "_id" : "7",
        "group_type" : "足球",
        "entity_type" : "FootBall",
        "tname":"上海鸭梨信息技术有限公司-足球队",
        "leader" : true
    },
    {
        "_id":"0"
    }
],
"hashed_password" : "AMQEr5SljqggnlY9LTJR8ZrHMAnYRRNJLnbNU/PriiZNiTkk9hPqPHc3T21mPcNVUqUL7xX1bJJ8axkoyK0cXQ==",
"_id" : "0002-0002-0002-0002-000200020003",
"nickname" : "yali_yg1",
"realname":"李三",
"phone" : "18801910251",
"photo" : "/img/icons/default_user_photo.png",
"provider" : "user",
"register_date" : new Date(),
"role" : "EMPLOYEE",
"salt" : "oGn/YzIa2UdFMCyju42JWA==",
"username" : "yali_yg1@163.com"
},
{
"active" : true,
"cid" : "0002-0002-0002-0002-000200020002",
"cname":"上海鸭梨信息技术有限公司",
"department" : "IT",
"email" : "yali_yg2@163.com",
"group" : [
    {
        "_id" : "7",
        "group_type" : "足球",
        "entity_type" : "FootBall",
        "tname":"上海鸭梨信息技术有限公司-足球队",
        "leader" : false
    },
    {
        "_id":"0"
    }
],
"hashed_password" : "AMQEr5SljqggnlY9LTJR8ZrHMAnYRRNJLnbNU/PriiZNiTkk9hPqPHc3T21mPcNVUqUL7xX1bJJ8axkoyK0cXQ==",
"_id" : "0002-0002-0002-0002-000200020004",
"nickname" : "yali_yg2",
"realname":"李四",
"phone" : "18801910251",
"photo" : "/img/icons/default_user_photo.png",
"provider" : "user",
"register_date" : new Date(),
"role" : "EMPLOYEE",
"salt" : "oGn/YzIa2UdFMCyju42JWA==",
"username" : "yali_yg2@163.com"
},
{
"active" : true,
"cid" : "0003-0003-0003-0003-000300030003",
"cname":"上海苹果信息技术有限公司",
"department" : "hr",
"email" : "pingguo_yg1@sina.com",
"group" : [
    {
        "_id" : "7",
        "group_type" : "足球",
        "entity_type" : "FootBall",
        "tname":"上海苹果信息技术有限公司-足球队",
        "leader" : true
    },
    {
        "_id":"0"
    }
],
"hashed_password" : "AMQEr5SljqggnlY9LTJR8ZrHMAnYRRNJLnbNU/PriiZNiTkk9hPqPHc3T21mPcNVUqUL7xX1bJJ8axkoyK0cXQ==",
"_id" : "0003-0003-0003-0003-000300030004",
"nickname" : "apple1",
"realname":"王三",
"phone" : "18801910251",
"photo" : "/img/icons/default_user_photo.png",
"provider" : "user",
"register_date" : new Date(),
"role" : "EMPLOYEE",
"salt" : "oGn/YzIa2UdFMCyju42JWA==",
"username" : "pingguo_yg1@sina.com"
},
{
"active" : true,
"cid" : "0004-0004-0004-0004-000400040004",
"cname":"上海香蕉信息技术有限公司",
"department" : "hr",
"email" : "xiangjiao_yg1@sohu.com",
"group" : [
    {
        "_id" : "7",
        "group_type" : "足球",
        "entity_type" : "FootBall",
        "tname":"上海香蕉信息技术有限公司-足球队",
        "leader" : false
    },
    {
        "_id":"0"
    }
],
"hashed_password" : "AMQEr5SljqggnlY9LTJR8ZrHMAnYRRNJLnbNU/PriiZNiTkk9hPqPHc3T21mPcNVUqUL7xX1bJJ8axkoyK0cXQ==",
"_id" : "0004-0004-0004-0004-000400040005",
"nickname" : "eric",
"realname":"赵四",
"phone" : "18801910251",
"photo" : "/img/icons/default_user_photo.png",
"provider" : "user",
"register_date" : new Date(),
"role" : "EMPLOYEE",
"salt" : "oGn/YzIa2UdFMCyju42JWA==",
"username" : "xiangjiao_yg1@sohu.com"
},
{
"active" : true,
"cid" : "0004-0004-0004-0004-000400040004",
"cname":"上海香蕉信息技术有限公司",
"department" : "IT",
"email" : "xiangjiao_yg2@sohu.com",
"group" : [
    {
        "_id" : "7",
        "group_type" : "足球",
        "entity_type" : "FootBall",
        "tname":"上海香蕉信息技术有限公司-足球队",
        "leader" : true
    },
    {
        "_id":"0"
    }
],
"hashed_password" : "AMQEr5SljqggnlY9LTJR8ZrHMAnYRRNJLnbNU/PriiZNiTkk9hPqPHc3T21mPcNVUqUL7xX1bJJ8axkoyK0cXQ==",
"_id" : "0004-0004-0004-0004-000400040006",
"nickname" : "xiangjiao_yg2",
"realname":"赵五",
"phone" : "18801910251",
"photo" : "/img/icons/default_user_photo.png",
"provider" : "user",
"register_date" : new Date(),
"role" : "EMPLOYEE",
"salt" : "oGn/YzIa2UdFMCyju42JWA==",
"username" : "xiangjiao_yg2@sohu.com"
}
];
try{
    _users.forEach(function (value) {
        db.users.insert(value);
    });
} catch (e){
    print(e);
};

// 公司组件
var _company_groups =[
{
    "_id" : "0001-0001-0001-0001-000100021212",
    "cid" : "0001-0001-0001-0001-000100010001",
    "cname":"上海动梨信息技术有限公司",
    "gid" : "7",
    "group_type" : "足球",
    "name" : "上海动梨信息技术有限公司-足球队",
    "leader" : [
        {
            "_id" : "0001-0001-0001-0001-000100010002",
            "nickname" : "eric",
            "photo": "/img/icons/default_user_photo.png"
        }
    ],
    "member" : [
        {
            "_id" : "0001-0001-0001-0001-000100010002",
            "nickname" : "eric",
            "photo": "/img/icons/default_user_photo.png"
        }
    ],
    "logo":"/img/icons/default_group_logo.png",
    "entity_type":"FootBall",
    "brief":"足球队"
},
{
    "_id" : "0002-0002-0002-0002-000100021212",
    "cid" : "0002-0002-0002-0002-000200020002",
    "cname":"上海鸭梨信息技术有限公司",
    "gid" : "7",
    "group_type" : "足球",
    "name" : "上海鸭梨信息技术有限公司-足球队",
    "leader" : [
        {
            "_id" : "0002-0002-0002-0002-000200020003",
            "nickname" : "yali_yg1",
            "photo": "/img/icons/default_user_photo.png"
        }
    ],
    "member" : [
        {
            "_id" : "0002-0002-0002-0002-000200020003",
            "nickname" : "yali_yg1",
            "photo": "/img/icons/default_user_photo.png"
        }
    ],
    "logo":"/img/icons/default_group_logo.png",
    "entity_type":"FootBall",
    "brief":"足球队"
},
{
    "_id" : "0003-0003-0003-0003-000100021212",
    "cid" : "0003-0003-0003-0003-000300030003",
    "cname":"上海苹果信息技术有限公司",
    "gid" : "7",
    "group_type" : "足球",
    "name" : "上海苹果信息技术有限公司-足球队",
    "leader" : [
        {
            "_id" : "0003-0003-0003-0003-000300030004",
            "nickname" : "apple1",
            "photo": "/img/icons/default_user_photo.png"
        }
    ],
    "member" : [
        {
            "_id" : "0003-0003-0003-0003-000300030004",
            "nickname" : "apple1",
            "photo": "/img/icons/default_user_photo.png"
        }
    ],
    "logo":"/img/icons/default_group_logo.png",
    "entity_type":"FootBall",
    "brief":"足球队"
},
{
    "_id" : "0004-0004-0004-0004-000100021212",
    "cid" : "0004-0004-0004-0004-000400040004",
    "cname":"上海香蕉信息技术有限公司",
    "gid" : "7",
    "group_type" : "足球",
    "name" : "上海香蕉信息技术有限公司-足球队",
    "leader" : [
        {
            "_id" : "0004-0004-0004-0004-000400040006",
            "nickname" : "xiangjiao_yg2",
            "photo": "/img/icons/default_user_photo.png"
        }
    ],
    "member" : [
        {
            "_id" : "0004-0004-0004-0004-000400040006",
            "nickname" : "xiangjiao_yg2",
            "photo": "/img/icons/default_user_photo.png"
        }
    ],
    "logo":"/img/icons/default_group_logo.png",
    "entity_type":"FootBall",
    "brief":"足球队"
}

];
try{
    _company_groups.forEach(function (value) {
        db.companygroups.insert(value);
    });
} catch (e){
    print(e);
};

//足球组件
var _football = [
    {
        "cid": "0001-0001-0001-0001-000100010001",
        "gid": "7",
        "main_force": [{
            "uid" : "0001-0001-0001-0001-000100010002",
            "nickname" : "eric",
            "photo": "/img/icons/default_user_photo.png"
        }],   //主力
        "create_date": new Date()
    },
    {
        "cid": "0002-0002-0002-0002-000200020002",
        "gid": "7",
        "main_force": [{
            "uid" : "0002-0002-0002-0002-000200020003",
            "nickname" : "yali_yg1",
            "photo": "/img/icons/default_user_photo.png"
        }],   //主力
        "create_date": new Date()
    },
    {
        "cid": "0003-0003-0003-0003-000300030003",
        "gid": "7",
        "main_force": [{
            "uid" : "0003-0003-0003-0003-000300030004",
            "nickname" : "apple1",
            "photo": "/img/icons/default_user_photo.png"
        }],   //主力
        "create_date": new Date()
    },
    {
        "cid": "0004-0004-0004-0004-000400040004",
        "gid": "7",
        "main_force": [{
            "uid" : "0004-0004-0004-0004-000400040006",
            "nickname" : "xiangjiao_yg2",
            "photo": "/img/icons/default_user_photo.png"
        }],   //主力
        "create_date": new Date()
    }
];
try{
    _football.forEach(function (value) {
        db.footballs.insert(value);
    });
} catch (e){
    print(e);
};

//@arema /*
//擂台数据
var _arena = [
{
"id":"0006-0001-0001-0001-000100010001",
"gid":"7",
"group_type":"足球",
"city":{
    "province":"上海",
    "city":"上海"
},
"address":"上海体育场"
},
{
"id":"0006-0001-0001-0001-000100010002",
"gid":"7",
"group_type":"足球",
"city":{
    "province":"北京",
    "city":"北京"
},
"address":"五棵松体育场"
},
{
"id":"0006-0001-0001-0001-000100010003",
"gid":"7",
"group_type":"足球",
"city":{
    "province":"河北",
    "city":"石家庄"
},
"address":"石家庄体育场"
},
{
"id":"0006-0001-0001-0001-000100010004",
"gid":"7",
"group_type":"足球",
"city":{
    "province":"浙江",
    "city":"杭州"
},
"address":"杭州体育场"
},
{
"id":"0006-0001-0001-0001-000100010005",
"gid":"7",
"group_type":"足球",
"city":{
    "province":"上海",
    "city":"上海"
},
"address":"万达体育场"
}
];
try{
    _arena.forEach(function (value) {
        db.arenas.insert(value);
    });
} catch (e){
    print(e);
};
//@arena*/