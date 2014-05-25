var User = function() {
    var self = this;
    self.__uuid__ = 0;

    // 缓存回调函数
    self.__getCallbacks__ = {};

    // 接收每次操作请求的回信
    process.on('message', function(data) {

        if (!data.isSharedMemoryMessage) return;
        // 通过uuid找到相应的回调函数
        var cb = self.__getCallbacks__[data.uuid];
        if (cb && typeof cb == 'function') {
            cb(data.value)
        }
        // 卸载回调函数
        self.__getCallbacks__[data.uuid] = undefined;
    });
};

// 处理操作
User.prototype.handle = function(method, key, value, callback) {

    var self = this;
    var uuid = self.__uuid__++;

    process.send({
        isSharedMemoryMessage: true,
        method: method,
        id: cluster.worker.id,
        uuid: uuid,
        key: key,
        value: value
    });

    // 注册回调函数
    self.__getCallbacks__[uuid] = callback;

};

User.prototype.set = function(key, value, callback) {
    this.handle('set', key, value, callback);
};

User.prototype.get = function(key, callback) {
    this.handle('get', key, null, callback);
};


