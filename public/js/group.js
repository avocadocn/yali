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