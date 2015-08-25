'use strict';

// NPM modules
var voicejs = require('voice.js'),
    Promise = require('es6-promise').Promise,
    fs      = require('fs');

// Local modules
var brad = require('./brad')

var client = new voicejs.Client({
  email:    process.argv[2] || 'brad@voice.js',
  password: process.argv[3] || 'qwertqwert',
  tokens:   require('./tokens.json')
});

/**
 * Gets all unread messages from inbox
 *
 * @return {Promise} to an array of question objects
 *   {phone_number, id, timestamp, last_message}
 */
var get_questions = function () {
  return new Promise (function (resolve) {
    // Get all conversations, not including spam. 
    // WARNING: MAY BE SLOW FOR VERY LARGE DATASETS
    client.get('unread', { limit: Infinity }, function (err, response, data) {
      if (err) return console.trace(err);

      if (!data ||
          !data.conversations_response ||
          !data.conversations_response.conversationgroup)
        return console.log('No conversations.');

      var convos = data.conversations_response.conversationgroup;
      var write_log = '';

      // Print each unread
      convos.forEach(function (convo, index) {
        var log = '' +
          new Date(convo.conversation.conversation_time).toISOString().replace(/[ZT]/g,' ').substr(0,16) +
          ' from ' +
          convo.call[0].phone_number +
          ': ' +
          convo.conversation.message_text.slice(-1)[0];
        console.log(log);
        write_log += log + '\n';
      });

      fs.appendFile('received_messages', write_log, function (err) {
        if (err) console.log('Error writing to log');
      });
      
      console.log(convos.length +  ' conversations retrieved');
      
      var questions = convos.map(function (convo) {
        return {
          phone_number: convo.call[0].phone_number,
          id:           convo.conversation.id,
          timestamp:    new Date(convo.conversation.conversation_time),
          last_message: convo.conversation.message_text.slice(-1)[0]
        }
      });

      resolve(questions);
    });
  });
}

/**
 * Asks brad for the answer to a question.
 * @param  {Object} question {phone_number, id, timestamp, last_message}
 * @return {Promise}         to {phone_number, id, message}
 */
var answer = function (question) {
  return brad
    .ask(question.last_message)
    .then(function (message) {
      return {
        phone_number: question.phone_number,
        id:           question.id,
        message:      message
      };
    });
}

/**
 * Sends answer objects, and marks the conversations as read.
 *
 * @param  {Object} ans {phone_number, id, message}
 *
 * @return {Promise}    to nothing lol.
 */
var send = function (ans) {
  return new Promise(function (resolve) {
    // console.log('Would send to', ans.phone_number, ':', ans.message);
    
    var response = {
      to:   ans.phone_number,
      text: ans.message
    }

    var done = {
      id:   ans.id,
      read: true
    }

    console.log(response);
    client.sms(response, function () {
      client.set('mark', done, resolve);
    });
  });
}


var main = function () {
  // Get incoming unread messages
  get_questions().then(function (questions) {
    // Handle messages
    return Promise.all(questions.map(answer))
  })
  .then(function (answers) {
    // Send messages
    return Promise.all(answers.map(send))
  })
  .catch(console.trace);

  // Do this every 5s
  setTimeout(main.bind(this), 5000);
}

main();
