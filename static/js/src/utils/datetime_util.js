/* globals define, console */
'use strict';

define(function (require) {

  function Utils () {

    this.translate = function (x, y) {
      return "translate(" + x + "," + y + ")";
    };

    this.guid = function () {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
    };

    this.isEmpty = function (obj) {
      return Object.getOwnPropertyNames(obj).length > 0 && JSON.stringify(obj) !== JSON.stringify({});
    };

    /**
     * Use this method to return the date display in your desired format
     * @param  {string} format check below for the supported format that can be replaced
     * @param  {integer} d      epoch time in milliseconds
     * @return {string}        formated time string
     */
     
    this.formatDate = function (format, d) {
      // Make sure we have milliseconds data
      //      1460127621000
      if (d < 1000000000000) { d *= 1000; }
      var newD = new Date(d);
      var fullyear, year, month, day, hour, minute, second, millisecond, weekday;

      fullyear = newD.getFullYear();
      year = fullyear.toString().substr(2, 2);
      month = newD.getMonth() + 1;
      day = newD.getDate();
      hour = newD.getHours();
      minute = newD.getMinutes();
      second = newD.getSeconds();
      weekday = newD.getDay();

      function getWeekday (length, d) {
        var weekdays = {
          1: 'Monday',
          2: 'Tuesday',
          3: 'Wednesday',
          4: 'Thursday',
          5: 'Friday',
          6: 'Saturday',
          7: 'Sunday'
        };

        if (length === 7) {
          // Return the name in full
          return weekdays[d];
        } else if (length === 1) {
          // Return the first letter, except for Thursday, return R
          if (d === 4) {
            return 'R';
          } else {
            //return weekdays[d][0];
          }
        } else {
          //return weekdays[d].substr(0, 3);
        }
      }

      function fullDigit (d) {
        return d >= 10 ? d : '0' + d;
      }

      var outString = format
                        .replace("YY", fullyear)
                        .replace("Y", year)
                        .replace("MM", fullDigit(month))
                        .replace("M", month)
                        .replace("DD", fullDigit(day))
                        .replace("D", day)
                        .replace("hh", fullDigit(hour))
                        .replace("h", hour)
                        .replace("mm", fullDigit(minute))
                        .replace("m", minute)
                        .replace("ss", fullDigit(second))
                        .replace("s", second)
                        .replace("WWW", getWeekday(7, weekday))
                        .replace("WW", getWeekday(3, weekday))
                        .replace("W", getWeekday(1, weekday));

      return outString;
    };
  }

  return new Utils();
});
