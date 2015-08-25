'use strict';

/**
 * Given a message, handles it
 */

// NPM modules
var rp = require('request-promise');

var menus_req = 'http://redapi-tious.rhcloud.com/dining/menu/ALL/ALL/LOCATIONS',
    time_url  = 'http://redapi-tious.rhcloud.com/dining/event/';

// Validation regex
var meals  = ['Breakfast', 'Brunch', 'Lunch', 'Dinner'],
    m_patt = /(breakfast|brunch|lunch|dinner)/;

// Responses for 
var inv_res =
  ['Sorry, I don\'t understand what you mean.',
   'wat',
   'do you even brad'];

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
};

module.exports.ask = function (message) {
  message = message.toLowerCase();

  return rp(menus_req)

    .then(function (body) {
      var data = JSON.parse(body);

      var location = Object.keys(data).reduce(function (p, c) {
        var s = hall_id[c];
        console.log(message.indexOf(s));
        if (!p && message.indexOf(s) >= 0) return c;
        else                               return p;
      }, false);

      console.log(message);
      console.log(location);
      if (!location)
        return inv_res[Math.floor(Math.random() * inv_res.length)];

      var meal = m_patt.exec(message)[0];

      // Specific meal menu
      // if (meal) {
        meal = meal.charAt(0).toUpperCase() + meal.slice(1);

        var meal_data = data[location][meal],
            content   = '';

        meal_data.forEach(function (o) {
          content += o.name + (o.healthy ? ' 🍎' : '') + '\n';
        });

        return content;

      // Is hall open
      // } else {
        // if (message.indexOf('open') < 0)
        //   return inv_res[Math.floor(Math.random() * inv_res.length)];

        // // UTC tz offset for EST tz converted to ms
        // var est_tz_offset = 14400000; // 240 * 60000

        // var t         = new Date(),
        //     utc_time  = t.getTime() + (t.getTimezoneOffset() * 60000),
        //     est_today = new Date(utc_time - est_tz_offset),
        //     est_tom   = new Date(),

        // est_tom.setDate(est_tom.getDate() + 1);

        // var before = est_today.toDateString().replace(/ /g, '%20'),
        //     after  = est_tom.toDateString().replace(/ /g, '%20');

        // var time_req = time_url + location + '/' + today + '-' + tomorrow;

        // return rp(time_req);

      // }

    })

    // .then(function (r) {
    //   var j = JSON.parse(r);

    //   if (j.type && j.type === 'menu') return j.content;
    //   else                             return 'not implemented lolerz';
    // })

    .catch(function (e) {
      console.trace(e);
      return 'Couldn\'t get menus :(';
    })
};
