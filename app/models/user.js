'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validate = require('mongoose-validate'),
    crypto = require('crypto'),
    config = require('../../config/config');



var _team = new Schema({
    gid: {
        type: String,
        ref: 'Group'
    },
    _id: Schema.Types.ObjectId,
    group_type: String,
    entity_type: String,           //对应的增强组件名字
    name : String,
    leader : {                    //该员工是不是这个小队的队长
        type : Boolean,
        default : false
    },
    logo: String
});

/**
 * User Schema
 */
var UserSchema = new Schema({
    username: {
        type: String,
        unique: true
    },
    email: {
        type: String,
        unique: true,
        validate: [validate.email, '请填写正确的邮箱地址']
    },
    //HR是否关闭此人
    active: {
        type: Boolean,
        default: false
    },
    //邮件激活
    mail_active:{
        type: Boolean,
        default: false
    },
    hashed_password: String,
    provider: {
        type: String,
        default: 'user'
    },
    salt: String,
    photo: {
        type: String,
        default: '/img/icons/default_user_photo.png'
    },

    nickname: String,
    realname: String,
    department: {
        name : String,
        _id : Schema.Types.ObjectId
    },
    position: String,
    sex: {
        type: String,
        enum: ['男', '女']
    },
    birthday: {
        type: Date
    },
    bloodType: {
        type: String,
        enum: ['AB', 'A', 'B', 'O' ]
    },
    introduce: {
        type: String
    },
    register_date: {
        type: Date,
        default: Date.now
    },
    phone: {
        type: String
    },
    qq: {
        type: String
    },
    role: {
        type: String,
        enum: ['LEADER','EMPLOYEE']      //HR 队长 普通员工
    },
    cid: {
        type: Schema.Types.ObjectId,
        ref: 'Company'
    },
    cname: String,
    company_official_name: String,
    team: [_team],
    app_token: String,
    //本系统是否关闭此人
    disabled:{
        type: Boolean,
        default: false
    },
    device:{
        device_type:{
            type:String,
            enum:['Android','IOS','WindowsPhone']
        },
        device_id:String  //用户设备生成的userId,可能会经常变动
    }
});

/**
 * Virtuals
 */
UserSchema.virtual('password').set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(password);
}).get(function() {
    return this._password;
});

/**
 * Validations
 */
var validatePresenceOf = function(value) {
    return value && value.length;
};


/**
 * Pre-save hook
 */
/*UserSchema.pre('save', function(next) {
    if (!this.isNew) return next();

    if (!validatePresenceOf(this.password) && !this.provider)
        next(new Error('Invalid password'));
    else
        next();
});*/

/**
 * Methods
 */
UserSchema.methods = {
    /**
     * Authenticate - check if the passwords are the same
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api public
     */
    authenticate: function(plainText) {
        return this.encryptPassword(plainText) === this.hashed_password;
    },

    /**
     * Make salt
     *
     * @return {String}
     * @api public
     */
    makeSalt: function() {
        return crypto.randomBytes(16).toString('base64');
    },

    /**
     * Encrypt password
     *
     * @param {String} password
     * @return {String}
     * @api public
     */
    encryptPassword: function(password) {
        if (!password || !this.salt) return '';
        var salt = new Buffer(this.salt, 'base64');
        return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
    }
};

mongoose.model('User', UserSchema);