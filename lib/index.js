"use strict";

var async = require('async');

var amqplib = require('amqplib/callback_api');

var AMQPClient = class AMQPClient {
  constructor(url, socketOptions) {
    this.channel = null;
    this.url = url;
    this.socketOptions = socketOptions;
  }

  getChannel(cb) {
    if(this.channel) {
      return process.nextTick(cb, null, this.channel);
    }
    var self = this;
    async.waterfall([
      function getConnection(cb) {
        amqplib.connect(self.url, self.socketOptions, cb);
      },
      function getChannel(connection, cb) {
        connection.createChannel(cb);
      },
      function saveChannel(channel, cb) {
        self.channel = channel;

        self.channel.once('close', () => {
          self.channel = null;
        });

        cb(null, channel);
      }
    ], cb);
  }

  createTask(queue, task, cb) {
    var self = this;
    async.waterfall([
      function getChannel(cb) {
        self.getChannel(cb);
      },
      function checkQueue(channel, cb) {
        channel.checkQueue(queue, function(err) {
          if(err && err.toString().includes('NOT_FOUND')) {
            return cb(new Error(`The queue ${queue} doesn't exists. Create it before trying to add tasks`));
          }
          cb(err, channel);
        });
      },
      function sendToQueue(channel, cb) {
        var msg;
        if(Buffer.isBuffer(task)) {
          msg = task;
        }
        else {
          msg = new Buffer.from(JSON.stringify(task));
        }
        async.until(
          () => channel.sendToQueue(queue, msg),
          cb => channel.connection.channels[channel.ch].buffer.once('drain', cb),
          cb
        );
      }
    ], cb);
  }
};

module.exports = AMQPClient;
