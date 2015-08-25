var voicejs = require('voice.js');
var brad = require('./brad')


var client = new voicejs.Client({
  email: process.argv[2] || 'brad@voice.js',
  password: process.argv[3] || 'qwertqwert',
  tokens: require('./tokens.json')
});

/**
 * Gets all unread messages inbox.
 * @return {Promise} to an array of question objects {phone_number, id, timestamp, last_message}
 */
var get_questions = function () {
  return new Promise (function (res, rej) {
    // Get all conversations, not including spam. 
    // WARNING: MAY BE SLOW FOR VERY LARGE DATASETS
    client.get('unread', {limit: Infinity}, function(error, response, data){
      if (error) {return console.trace(error);}
      if (!data || !data.conversations_response || !data.conversations_response.conversationgroup){ return console.log('No conversations.'); }

      // Display the conversations in descending order
      data.conversations_response.conversationgroup.reverse().forEach(function(convo, index){
        console.log('%s %s. %s %s',
          new Date(convo.conversation.conversation_time).toISOString().replace(/[ZT]/g,' ').substr(0,16),
          convo.call[0].phone_number,
          convo.conversation.id,
          convo.conversation.message_text[0]
        );
      });
      
      console.log(data.conversations_response.conversationgroup.length +  ' conversations retrieved');
      
      var questions = data.conversations_response.conversationgroup.map(function (convo) {
        return {
          phone_number : convo.call[0].phone_number,
          id : convo.conversation.id,
          timestamp : new Date(convo.conversation.conversation_time),
          last_message : convo.conversation.message_text[0]
        }
      });

      res(questions);
    });
  });
}

/**
 * Asks brad for the answer to a question.
 * @param  {Object} question {phone_number, id, timestamp, last_message}
 * @return {Promise}         to {phone_number, id, message}
 */
var answer = function (question) {
  // console.log(question);

  return brad.ask(question.last_message).then(function (message) {
    var ans = {
      phone_number : question.phone_number,
      id : question.id,
      message : message
    };
    return ans;
  });
}

/**
 * Sends answer objects, and marks the conversations as read.
 * @param  {Object} ans {phone_number, id, message}
 * @return {Promise}    to nothing lol.
 */
var send = function (ans) {
  return new Promise(function (res, rej) {
    // console.log('Would send to', ans.phone_number, ':', ans.message);
    
    var response = {
      to: ans.phone_number,
      text: ans.message
    }

    var done = {
      id : ans.id,
      read : true
    }

    console.log(response);
    client.sms(response, function () {
      console.log('b');
      client.set('mark', done, res);
    });
  });
}


var main = function () {
  console.log('yay');
  get_questions().then(function (questions) {
    return Promise.all(questions.map(answer))
  })
  .then(function (answers) {
    return Promise.all(answers.map(send))
  })
  .catch(console.trace)

  setTimeout(main.bind(this), 5000);
}

main();