var Utility;

Utility = {
  course_id_re: /([A-Z]{3}) ?(\d{2,3})/,
  getCourseIdFromString: function(str) {
    var match;
    match = str.match(Utility.course_id_re);
    if (match != null) {
      return match[1] + match[2];
    } else {
      throw "String did not match course id!";
    }
  }
};
