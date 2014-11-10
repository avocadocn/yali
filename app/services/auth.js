'use strict';

/**
 * 任务权限说明列表, 一个任务可以是一个方法，接受role参数，返回Boolean值；
 * 也可以是一个对象，例如example中的uploadPhoto，当公司角色是hr或member，或者小队角色是leader或member时都可以执行该任务
 * example:
 *  registeredTasks = {
 *    publishComment: function (role) {
 *      if (role.company === 'member') return true;
 *      else return false;
 *    },
 *    uploadPhoto: {
 *      company: ['hr', 'member'],
 *      team: ['leader', 'member']
 *    },
 *    deletePhoto: {
 *      company: ['hr'],
 *      team: ['leader'],
 *      user: ['self']
 *    }
 *  }
 * @type {Object}
 */
var registeredTasks = {
  publishComment: {
    company: ['member']
  },
  setScoreBoardScore: {
    company: ['hr'],
    team: ['leader']
  },
  confirmScoreBoardScore: {
    company: ['hr'],
    team: ['leader']
  },
  getScoreBoardLogs: {
    company: ['hr'],
    team: ['leader']
  },
  getUserAllCampaignsForCalendar: {
    user: ['self']
  },
  joinCompanyCampaign: {
    company: ['member']
  },
  joinTeamCampaign: {
    team: ['leader', 'member']
  },
  quitCampaign: {
    user: ['self']
  },
  editTeamCampaign: {
    company: ['hr'],
    team: ['leader']
  },
  editCompanyCampaign: {
    company: ['hr']
  },
  cancelCampaign: {
    company: ['hr'],
    team: ['leader']
  },
  dealProvoke: {
    company: ['hr'],
    team: ['leader']
  },
  uploadPhoto: {
    company: ['hr'],
    team: ['leader', 'member']
  },
  visitPhotoAlbum: {
    company: ['hr', 'member']
  },
  sponsorCampaign: {
    company: ['hr'],
    team: ['leader']
  },
  getOneTeaminfo:{
    company:['hr']
  },
  getMyTeaminfo:{
    team:['leader', 'member']
  },
  searchSameCityTeam:{
    team:['leader', 'member']
  },
  sponsorProvoke: {
    company: ['hr'],
    team: ['leader']
  },
  joinTeam: function (role) {
    if (role.company === 'member' && !role.team) {
      return true;
    } else {
      return false;
    }
  },
  quitTeam: {
    team: ['leader', 'member']
  },
  closeTeam: {
    company: ['hr']
  },
  editTeam: {
    company: ['hr'],
    team: ['leader']
  },
  // 发小队站内信
  publishTeamMessage: {
    company: ['hr'],
    team: ['leader']
  },
  editGroupInfo:{
    company:['hr'],
    team:['leader']
  },
  //给队长发站内信
  recommandTeamToLeader:{
    team:['member']
  }
};


/**
 * 比较用户和资源的关系，获取对应的角色
 * @param {Object} user req.user
 * @param {Object} owner 资源的所属者, 部门资源视为部门的组的资源
 *  owner: {
 *    companies: [{Mongoose.Schema.Types.ObjectId|String}],(必需)
 *    teams: [{Mongoose.Schema.Types.ObjectId|String}],
 *    users: [{Mongoose.Schema.Types.ObjectId|String}]
 *  }
 * @return {Object} 返回一个角色对象
 *  role: {
 *    company: String, // 'hr' or 'member'
 *    team: String, // 'leader' or 'member'
 *    user: String // 'self', 不是自己则没有此属性
 *  }
 *  对于公司用户，role只可能有company属性
 *  如果与资源的公司、小队、部门等无关，则不会有该属性，例如用户不是某相册资源所属的小队，则没有team属性
 */
var getRole = function (user, owner) {
  var role = {};
  if (!user) { return role; }

  if (user.provider === 'company') {
    if (owner.companies) {
      for (var i = 0; i < owner.companies.length; i++) {
        if (user._id.toString() === owner.companies[i].toString()) {
          role.company = 'hr';
        }
      }
    }
  } else if (user.provider === 'user') {

    // 判断是否是公司成员
    if (owner.companies) {
      var cid = user.populated('cid') || user.cid;
      cid = cid.toString();
      for (var i = 0; i < owner.companies.length; i++) {
        if (cid === owner.companies[i].toString()) {
          role.company = 'member';
        }
      }
    }


    if (owner.teams) {
      // 判断是否是小队成员, 用户可能同属于这两个小队，所以owner.teams需要完全遍历
      for (var i = 0; i < owner.teams.length; i++) {

        for (var j = 0; j < user.team.length; j++) {
          if (user.team[j]._id.toString() === owner.teams[i].toString()) {
            if (user.team[j].leader === true) {
              role.team = 'leader';
            } else {
              role.team = 'member';
            }
            break;
          }
        }

        // 如果已确认是队长，则不再查找，保留权限最高的角色
        if (role.team && role.team === 'leader') {
          break;
        }
      }
    }

    // 判断是否是自己的资源
    if (owner.users) {
      for (var i = 0; i < owner.users.length; i++) {
        if (user._id.toString() === owner.users[i].toString()) {
          role.user = 'self';
        }
      }
    }


  }
  return role;
};


/**
 * 判断该角色是否能执行某些任务
 * @param {Object} role getRole方法返回的role对象
 * @param {Array} tasks 需要判断的任务列表, 例如:['uploadPhoto', 'createPhotoAlbum']
 * @return {Object} 返回一个任务名、是否可以执行的键值对
 * 例如:
 *  {
 *    uploadPhoto: true,
 *    createPhotoAlbum: false
 *  }
 *
 */
var _auth = function (role, tasks) {
  var taskCando = {};

  for (var i = 0; i < tasks.length; i++) {
    var taskName = tasks[i];
    var registeredTask = registeredTasks[taskName];

    if (typeof(registeredTask) === 'function') {
      taskCando[taskName] = registeredTask(role);
    } else {
      taskCando[taskName] = false;
      for (var key in role) {
        if (registeredTask[key] && registeredTask[key].indexOf(role[key]) !== -1) {
          taskCando[taskName] = true;
          break;
        }
      }

    }
  }
  return taskCando;
};

/**
 * 权限验证
 * @param user req.user
 * @param owner 资源的所属者, 部门资源视为部门的组的资源
 *  owner: {
 *    companies: [{Mongoose.Schema.Types.ObjectId|String}], (必需)
 *    teams: [{Mongoose.Schema.Types.ObjectId|String}],
 *    users: [{Mongoose.Schema.Types.ObjectId|String}]
 *  }
 * @param tasks 需要判断的任务列表, 例如:['uploadPhoto', 'createPhotoAlbum']
 * @returns {Object}
 * 例如:
 *  {
 *    uploadPhoto: true,
 *    createPhotoAlbum: false
 *  }
 */
module.exports = function (user, owner, tasks) {
  var role = getRole(user, owner);
  return _auth(role, tasks);
};