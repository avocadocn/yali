'use strict';

var test = [];

for(var i = 0; i < 1000000; i ++) {
    test.push({
        'id_a':i,
        'id_b':'test_'+i,
        "city" : [
            {
                "district" : [
                    {
                        "id" : "C626229D-8A70-0001-C01A-1516270011CD",
                        "name" : "黄浦"
                    }
                ],
                "name" : "上海"
            }
        ],
        "name" : "上海"
    });
}

try{
    test.forEach(function (value) {
        db.tests.insert(value);
    });
} catch (e){
    print(e);
};
