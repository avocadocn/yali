'use strict';

var mongoose = require('mongoose'),
  Region = mongoose.model('Region');



function getDistrictJSON(districts){
  var rst = [];
  for(var i = 0 ; i < districts.length; i ++) {
    rst.push({
      "label":districts[i].name,
      "value":districts[i].name
    });
  }
  return rst;
}

function getCityJSON(cities) {
  var rst = [];
  for(var i = 0;i<cities.length; i ++) {
    rst.push({
      "label":cities[i].name,
      "value":cities[i].name,
      "data":getDistrictJSON(cities[i].district)
    });
  }
  return rst;
}
exports.regionAsJSON = function(req, res) {
  var rst = {
    "data":[]
  }
  Region.find(null,function (err, regions) {
    if(err || !regions) {
      return res.send([]);
    } else {
      for(var i = 0; i < regions.length; i ++) {
        rst.data.push({
          "label":regions[i].name,
          "value":regions[i].name,
          "data":getCityJSON(regions[i].city)
        });
      }
      return res.send(rst);
    }
  });
};