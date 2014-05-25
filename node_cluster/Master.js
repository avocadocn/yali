var Manager = function() {

    var self = this;

    // 初始化共享内存
    self.__sharedMemory__ = {};

    // 监听并处理来自worker的请求
    cluster.on('online', function(worker) {
        worker.on('message', function(data) {
            // isSharedMemoryMessage是操作共享内存的通信标记
            if (!data.isSharedMemoryMessage) return;
            self.handle(data);
        });
    });
};

Manager.prototype.handle = function(data) {
    var self = this;
    var value = this[data.method](data);

    var msg = {
        // 标记这是一次共享内存通信
        isSharedMemoryMessage: true,
        // 此次操作的唯一标示
        uuid: data.uuid,
        // 返回值
        value: value
    };

    cluster.workers[data.id].send(msg);
};

// set操作返回ok表示成功
Manager.prototype.set = function(data) {
    this.__sharedMemory__[data.key] = data.value;
    return 'OK';
};

// get操作返回key对应的值
Manager.prototype.get = function(data) {
    return this.__sharedMemory__[data.key];
};