# Utilities used everywhere

Utility =
  course_id_re: /([A-Z]{3}) ?(\d{2,3})/
  getCourseIdFromString: (str) ->
    match = str.match Utility.course_id_re
    if match?
      match[1] + match[2]
    else
      throw "String did not match course id!"
