'use strict';

//组件脚本
var _group =[
  {
      '_id':'0',
      'group_type':'虚拟组',
      'entity_type':'Company',
      'active':true
  },
  {
      '_id':'1',
      'group_type':'羽毛球',
      'entity_type':'Badminton',
      'active':true
  },
  {
      '_id':'2',
      'group_type':'篮球',
      'entity_type':'BasketBall',
      'active':true
  },
  {
      '_id':'3',
      'group_type':'阅读',
      'entity_type':'Reading',
      'active':true
  },
  {
      '_id':'4',
      'group_type':'自行车',
      'entity_type':'Bicycle',
      'active':true
  },
  {
      '_id':'5',
      'group_type':'下午茶',
      'entity_type':'AfternoonTea',
      'active':true
  },
  {
      '_id':'6',
      'group_type':'棋牌',
      'entity_type':'Chess',
      'active':true
  },
  {
      '_id':'7',
      'group_type':'足球',
      'entity_type':'FootBall',
      'active':true
  },
  {
      '_id':'8',
      'group_type':'k歌',
      'entity_type':'Ktv',
      'active':true
  },
  {
      '_id':'9',
      'group_type':'健身',
      'entity_type':'Fitness',
      'active':true
  },
  {
      '_id':'10',
      'group_type':'美食',
      'entity_type':'Food',
      'active':true
  },
  {
      '_id':'11',
      'group_type':'跑步',
      'entity_type':'Running',
      'active':true
  },
  {
      '_id':'12',
      'group_type':'亲子',
      'entity_type':'Kids',
      'active':true
  },
  {
      '_id':'13',
      'group_type':'影视',
      'entity_type':'Movie',
      'active':true
  },
  {
      '_id':'14',
      'group_type':'摄影',
      'entity_type':'Photography',
      'active':true
  }
  ,
  {
      '_id':'15',
      'group_type':'旅行',
      'entity_type':'Travel',
      'active':true
  }
  ,
  {
      '_id':'16',
      'group_type':'桌游',
      'entity_type':'BoardGame',
      'active':true
  },
  {
      '_id':'17',
      'group_type':'其他',
      'entity_type':'Other',
      'active':true
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
    "city" : [
        {
            "district" : [
                {
                    "id" : "C626229D-8A70-0001-C01A-1516270011CD",
                    "name" : "黄浦"
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