'use strict';

var async = require('async');


var Client = require('../lib');

var testQueue = 'AMQP-task-builder-test-queue';

var cleanRabbitmq = function cleanRabbitmq(cb) {
  var client = new Client('amqp://guest:guest@localhost:5672/');
  async.waterfall([
    function getChannel(cb) {
      client.getChannel(cb);
    },
    function assertQueue(channel, cb) {
      channel.assertQueue(testQueue, {durable: false}, err => cb(err, channel));
    },
    function cleanQueue(channel, cb) {
      channel.purgeQueue(testQueue, cb);
    }
  ], cb);
};


describe('Client', function() {
  describe('getChannel()', function() {
    var client = new Client('amqp://guest:guest@localhost:5672/');

    it('should return channel', function(done) {
      client.getChannel((err, channel) => {
        if(err) {
          return done(err);
        }
        channel.should.be.an.Object();
        done();
      });
    });

    it('should return a singleton', function(done) {
      async.waterfall([
        function getFirstChannel(cb) {
          client.getChannel(cb);
        },
        function flagAndGetSecondChannel(channel, cb) {
          channel.unicityFlag = true;
          client.getChannel(cb);
        },
        function checkChannel(channel, cb) {
          channel.unicityFlag.should.be.true();
          cb();
        }
      ], done);
    });
  });

  describe('createTask()', function() {
    beforeEach(cleanRabbitmq);

    after(cleanRabbitmq);

    var client = new Client('amqp://guest:guest@localhost:5672/');

    it('should create task from Object', function(done) {
      async.waterfall([
        function createTask(cb) {
          client.createTask(testQueue, {foo: 'bar'}, cb);
        },
        function getChannel(cb) {
          client.getChannel(cb);
        },
        function getQueueInfo(channel, cb) {
          channel.assertQueue(testQueue, {durable: false}, cb);
        },
        function checkQueue(queueInfo, cb) {
          queueInfo.messageCount.should.eql(1);
          cb();
        }
      ], done);
    });

    it('should create task from Buffer', function(done) {
      async.waterfall([
        function createTask(cb) {
          client.createTask(testQueue, new Buffer.from('FooBar'), cb);
        },
        function getChannel(cb) {
          client.getChannel(cb);
        },
        function getQueueInfo(channel, cb) {
          channel.assertQueue(testQueue, {durable: false}, cb);
        },
        function checkQueue(queueInfo, cb) {
          queueInfo.messageCount.should.eql(1);
          cb();
        }
      ], done);
    });
  });
});
