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

module.exports.ask = function (input) {
  input = input.toLowerCase();

  var menu_data,
      time_data,
      location;

  return rp(menus_req)

    .then(function (body) {
      // Save menus
      menu_data = JSON.parse(body);

      // Extract long and short location from input
      location = Object.keys(menu_data).reduce(function (loc, current) {
        var s = shorten_name(current);
        if (!loc.l && input.indexOf(s) >= 0) return { s: s, l: current };
        else                                 return loc;
      }, { s: '', l: false });

      // Create time req
      // UTC tz offset for EST tz converted to ms
      var est_tz_offset = 14400000; // 240 * 60000

      var t         = new Date(),
          utc_time  = t.getTime() + (t.getTimezoneOffset() * 60000),
          est_today = new Date(utc_time - est_tz_offset),
          est_tom   = new Date();

      est_tom.setDate(est_tom.getDate() + 1);

      var before = est_today.toDateString().replace(/ /g, '%20'),
          after  = est_tom.toDateString().replace(/ /g, '%20');

      var time_req = time_url + location.l + '/' + before + '-' + after;

      return rp(time_req);
    })
    .then(function (body) {
      time_data = JSON.parse(body);

      // Fail if no location
      if (!location.l) {
        return invalid_response();
      }

      // Try to extract meal from input
      var meal = m_patt.exec(input);

      if (meal) {
        // Specific meal menu
        meal = cap(meal[0]);

        if (open_for_meal(meal, time_data[location.l]) && menu_data[location.l][meal]) {

          var meal_data = menu_data[location.l][meal],
              content   = [];

          // Open for that meal
          meal_data.forEach(function (m) {
            content.push(m.name + (m.healthy ? ' (h)' : ''));
          });

          return {
            s: cap(location.s) + ' ' + meal,
            l: content.join('\n')
          }

        } else {
          // Return closed
          return {
            s: cap(location.s),
            l: cap(location.s) + ' is closed for ' + meal.toLowerCase() + '.'
          }
        }

      } else {
        // Open/closed
        var data = time_data[location.l];

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
        if (atm && atm.length > 0) {
          return {
            s: cap(location.s),
            l: atm[0].summary
          };

        } else {

          if (nxt.length > 0) {
            var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
                          'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

            var opens = new Date(nxt[0].start);

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

            return {
              s: cap(location.s),
              l: 'Closed right now. Opens on ' + ret + ' at ' + hrs + ':' +
                 ((m < 10) ? '0' + m : m) + ap + '.'
            };

          // Closed and not open soon
          } else {
            return {
              s: cap(location.s),
              l: 'Closed right now.'
            };
          }
        }
      }
    })

    .catch(function (e) {
       throw e;
      return 'Couldn\'t get info :(';
    });

};

// Given a meal name and a set of time data, determine if the hall is open
// during the meal
var open_for_meal = function (meal, data) {
  var mealtime = {
    'Breakfast': new Date((new Date()).setHours(10, 0)),
    'Brunch':    new Date((new Date()).setHours(11, 0)),
    'Lunch':     new Date((new Date()).setHours(12, 0)),
    'Dinner':    new Date((new Date()).setHours(18, 0))
  }

  meal = mealtime[meal];

  var atm = data.filter(function (event) {
    var start = (new Date(event.start)).getTime();
    var end   = (new Date(event.end)).getTime();
    var now   = meal.getTime();
    return (start < now) && (now < end);
  });

  return (atm.length > 0);
}

// Returns an invalid response
var invalid_response = function () {
  // Responses for invalid input
  var inv_res = [
    'Sorry, I don\'t get what you mean.',
    'wat',
    'lolwut'
  ];

  return {
    s: 'pls',
    l: inv_res[Math.floor(Math.random() * inv_res.length)]
  };
}

// Capitalizes first letter after every space
var cap = function (s) {
  return s.replace(/\b\w/g, function (m) {
      return m.toUpperCase();
  });
}

// Converts a long name (hall id) to a short name
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
