amqp-task-builder
=================

Tool to create amqp tasks for debug and hack based on https://github.com/squaremo/amqp.node

# Usage
```js
'use strict';
var Client = require('amqp-task-builder');

var client = new Client('amqp://guest:guest@localhost:5672/', socketOptions)

client.createTask('my-queue', {
  foo: bar
}, err => console.error(err));

client.createTask('my-queue', new Buffer.from('any data'), err => console.error(err));
```
