//修改小队类型，使存在比分
db.companygroups.update({score_rank:{$exists:false}},{$set:{"score_rank" : {
    "rank" : 0,
    "score" : 0,
    'win' : 0,
    'tie' : 0,
    'lose' : 0
  }}},{multi:true})