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
  '104' : '104west',
  'libe' : 'amit_bhatia_libe_cafe',
  'atrium' : 'atrium_cafe',
  // 'nasties' : 'bear_necessities',
  'bears den' : 'bears_den',
  'becker' : 'becker_house_dining_room',
  'big red barn' : 'big_red_barn',
  'jennie' : 'cafe_jennie',
  'carols' : 'carols_cafe',
  'cascadeli' : 'cascadeli',
  'cook' : 'cook_house_dining_room',
  'dairy bar' : 'cornell_dairy_bar',
  'goldies' : 'goldies',
  'green dragon' : 'green_dragon',
  'ivy room' : 'ivy_room',
  'bethe' : 'jansens_dining_room_bethe_house',
  'jansens market' : 'jansens_market',
  'keeton' : 'keeton_house_dining_room',
  'marthas' : 'marthas_cafe',
  // 'mattins' : 'mattins_cafe',
  'appel' : 'north_star',
  'okies' : 'okenshields',
  'okenshields' : 'okenshields',
  'risley' : 'risley_dining',
  'rpcc' : 'robert_purcell_marketplace_eatery',
  'rose' : 'rose_house_dining_room',
  'rustys' : 'rustys',
  'synapsis' : 'synapsis_cafe',
  'trillium' : 'trillium'
};

module.exports.ask = function (message) {
  return rp(menus_req)

    .then(function (body) {
      var data = JSON.parse(body);

      var location = Object.keys(data).reduce(function (p, c) {
        // var s = c.replace(/_.*$/, '');
        var s = hall_id[c];
        if (!p && message.indexOf(s) >= 0) return c;
        else                                   return p;
      }, false);

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
