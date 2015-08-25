'use strict';

/**
 * Given a message, handles it
 */

// NPM modules
var rp = require('request-promise');

// API routes
var menus_req = 'http://redapi-tious.rhcloud.com/dining/menu/ALL/ALL/LOCATIONS',
    time_url  = 'http://redapi-tious.rhcloud.com/dining/event/';

// Meals and regex
var meals  = ['Breakfast', 'Brunch', 'Lunch', 'Dinner'],
    m_patt = /(breakfast|brunch|lunch|dinner)/;

// Responses for invalid input
var inv_res =
  ['Sorry, I don\'t understand what you mean.',
   'wat',
   'do you even brad'];

module.exports.ask = function (message) {
  message = message.toLowerCase();

  var est_today, location;

  return rp(menus_req)

    .then(function (body) {
      var data = JSON.parse(body);

      // Get location from message
      location = Object.keys(data).reduce(function (loc, current) {
        var s = shorten_name(current);
        if (!loc && message.indexOf(s) >= 0) return current;
        else                               return loc;
      }, false);

      // No location, return a random invalid response
      if (!location)
        return inv_res[Math.floor(Math.random() * inv_res.length)];

      var meal = m_patt.exec(message);

      // Specific meal menu
      if (meal) {
        meal = meal[0].charAt(0).toUpperCase() + meal[0].slice(1);

        var meal_data = data[location][meal],
            content   = [];

        // Open for that meal
        if (meal_data) {
          meal_data.forEach(function (m) {
            content.push(m.name + (m.healthy ? ' 🍎' : ''));
          });

          return {
            type: 'menu',
            c:    content.join('\n')
          };

        // Closed for that meal
        } else {
          return {
            type: 'menu',
            c:    'Closed for ' + meal[0]
          }
        }

      // Is hall open
      } else {
        if (message.indexOf('open') < 0)
          return inv_res[Math.floor(Math.random() * inv_res.length)];

        // UTC tz offset for EST tz converted to ms
        var est_tz_offset = 14400000; // 240 * 60000

        var t         = new Date(),
            utc_time  = t.getTime() + (t.getTimezoneOffset() * 60000),
            est_tom   = new Date();

        est_today = new Date(utc_time - est_tz_offset);
        est_tom.setDate(est_tom.getDate() + 1);

        var before = est_today.toDateString().replace(/ /g, '%20'),
            after  = est_tom.toDateString().replace(/ /g, '%20');

        var time_req = time_url + location + '/' + before + '-' + after;

        return rp(time_req);

      }

    })

    .then(function (result) {
      // Just return menu data
      if (result.type && result.type === 'menu') {
        return result.c;

      // Open/closed query
      } else {
        var data = JSON.parse(result)[location];

        // Open now
        var atm = data.filter(function (event) {
          var start = (new Date(event.start)).getTime();
          var end   = (new Date(event.end)).getTime();
          var now   = est_today.getTime();
          return (start < now) && (now < end);
        });

        // Open sometime soon
        var nxt = data.filter(function (event) {
          var start = (new Date(event.start)).getTime();
          var end   = (new Date(event.end)).getTime();
          var now   = (new Date()).getTime();
          return (now < start) && (now < end);
        })
        .sort(function (a, b) {
          a = (new Date(a.start)).getTime();
          b = (new Date(b.start)).getTime();
          return a - b;
        });

        // Open now
        if (atm.length > 0) {
          return atm[0].summary;

        } else {

          if (nxt.length > 0) {
            var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
                          'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

            var opens = new Date(nxt[0].start);
            console.log(opens);

            var ret = days[opens.getDay()] + ', ' + months[opens.getMonth()];
                ret += ' ' + opens.getDate();

            var hrs = opens.getHours();
            var ap  = 'am';

            if (hrs >= 12) {
              hrs -= 12;
              ap = 'pm';
            }
            hrs = (hrs == 0) ? 12 : hrs;

            var m = opens.getMinutes();

            return 'Closed right now. Opens on ' + ret + ' at ' + hrs + ':' +
              ((m < 10) ? '0' + m : m) + ap + '.';

          // Closed and not open soon
          } else {
            return 'Closed right now.';
          }
        }
      }
    })

    .catch(function (e) {
      console.trace(e);
      return 'Couldn\'t get info :(';
    });
};

var shorten_name = function (lg) {
  var hall_id = {
    '104west':                           '104',
    'amit_bhatia_libe_cafe':             'libe',
    'atrium_cafe':                       'atrium',
    'bear_necessities':                  'nasties',
    'bears_den':                         'bears den',
    'becker_house_dining_room':          'becker',
    'big_red_barn':                      'big red barn',
    'cafe_jennie':                       'jennie',
    'carols_cafe':                       'carols',
    'cascadeli':                         'cascadeli',
    'cook_house_dining_room':            'cook',
    'cornell_dairy_bar':                 'dairy bar',
    'goldies':                           'goldies',
    'green_dragon':                      'green dragon',
    'ivy_room':                          'ivy room',
    'jansens_dining_room_bethe_house':   'bethe',
    'jansens_market':                    'jansens market',
    'keeton_house_dining_room':          'keeton',
    'marthas_cafe':                      'marthas',
    'mattins_cafe':                      'mattins',
    'north_star':                        'appel',
    'okenshields':                       'okenshields',
    'risley_dining':                     'risley',
    'robert_purcell_marketplace_eatery': 'rpcc',
    'rose_house_dining_room':            'rose',
    'rustys':                            'rustys',
    'synapsis_cafe':                     'synapsis',
    'trillium':                          'trillium'
  }

  return hall_id[lg];
}
