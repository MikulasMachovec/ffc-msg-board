'use strict';

const message_db = require(process.cwd() + '/model/msg-model.js');
const replyHandler = require(process.cwd() + '/controller/replyHandler.js')
const threadHandler = require(process.cwd() + '/controller/threadHandler.js')
module.exports = function (app) {
  
  app.route('/api/threads/:board')
     .get(threadHandler.getThread)
     .post(threadHandler.postThread)
     .delete(threadHandler.deleteThread)
     .put(threadHandler.putThread)

  app.route('/api/replies/:board')
     .get(replyHandler.getReply)
     .post(replyHandler.postReply)
     .delete(replyHandler.deleteReply)
     .put(replyHandler.putReply)

};
