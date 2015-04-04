var addCourse, courseRE, gradedCourses, listItemActions, listItemFactory, lookingUpCourse, lookupCourse, make_url, noCourseRE, prereqRE, prereqtests, quoteRE, resultCourse, stopEvent, warning;

stopEvent = function(event) {
  event.stopPropagation();
  event.preventDefault();
  return false;
};

courseRE = /[A-Z]{3}\s?\d{3}$/;

warning = $("#warning");

$("#add-course").on("submit", function(event) {
  var courseId, j;
  j = this["course-name"];
  courseId = j.value;
  if (courseRE.test(courseId)) {
    addCourse(courseId);
    warning.hide();
  } else {
    warning.text("'" + courseId + "' improper format. Eg: 'CSC 365'").show();
  }
  j.value = "";
  return stopEvent(event);
});

$("#course-name").on("drop", function(event) {
  var courseId, error;
  courseId = null;
  console.log(event.originalEvent.dataTransfer);
  try {
    courseId = event.originalEvent.dataTransfer.getData("text");
  } catch (_error) {
    error = _error;
    null;
  }
  if (courseId != null) {
    if (courseRE.test(courseId)) {
      courseId = courseRE.exec(courseId)[0];
      addCourse(courseId);
    }
    return stopEvent(event);
  }
});

$(".course-list").on("click", "p", function(event) {
  if (!$(event.target).is("em")) {
    return $(this).toggleClass("one-high");
  }
});

addCourse = function(courseId) {
  return lookupCourse(courseId, function(obj) {
    var li;
    if (obj === false) {
      return warning.text("Course: '" + courseId + "' does not exist").show();
    } else {
      li = listItemFactory(obj);
      return $(".course-list").append(li);
    }
  });
};

this.addCourse = addCourse;

lookingUpCourse = null;

lookupCourse = function(courseId, callback) {
  lookingUpCourse = callback;
  return $.getScript(make_url(courseId), (function(error, res) {}));
};

resultCourse = function(obj) {
  lookingUpCourse(obj);
  return lookingUpCourse = null;
};

make_url = function(course) {
  course = encodeURIComponent(course);
  return "http://missouristate.info/scripts/courseinfo.aspx?code=" + course;
};

prereqRE = /Prerequisite:(.+?)<\//;

quoteRE = "(?:&quot;|\")";

gradedCourses = RegExp(quoteRE + "([A-Z])" + quoteRE + "\\sor\\sbetter\\sin\\s([^\\.;]+)");

prereqtests = [
  function(info, str) {
    var crs, match, re, results;
    info.grades = {};
    re = new RegExp(gradedCourses.source, "g");
    results = [];
    while (match = re.exec(str)) {
      results.push((function() {
        var i, len, ref, results1;
        ref = match[2].split(" or ");
        results1 = [];
        for (i = 0, len = ref.length; i < len; i++) {
          crs = ref[i];
          if (courseRE.test(crs.trim())) {
            results1.push(info.grades[crs] = match[1]);
          }
        }
        return results1;
      })());
    }
    return results;
  }, function(info, str) {
    var entity, match, re, results;
    info.perms = {};
    re = /permissions?\sof\s([a-zA-Z\s]+)/g;
    results = [];
    while (match = re.exec(str)) {
      results.push((function() {
        var i, len, ref, results1;
        ref = match[1].split(" or ");
        results1 = [];
        for (i = 0, len = ref.length; i < len; i++) {
          entity = ref[i];
          results1.push(info.perms[entity] = true);
        }
        return results1;
      })());
    }
    return results;
  }
];

listItemActions = "<div class='course-actions'>\n  <button type=\"button\" class=\"close\">\n    <span aria-hidden=\"true\">×</span>\n    <span class=\"sr-only\">Close</span>\n  </button>\n  <div class='course-flags'></div>\n</div>";

listItemFactory = function(obj) {
  var descEl, description, listItem, prereq, title, titleEl;
  title = obj.title, description = obj.description, prereq = obj.prereq;
  listItem = $("<LI></LI>");
  listItem.append($(listItemActions));
  titleEl = $("<div class='course-title'>");
  titleEl.html(title);
  listItem.append(titleEl);
  descEl = $("<div class='course-description'>");
  descEl.html(description);
  listItem.append(descEl);
  return listItem;
};

noCourseRE = /Course not found/i;

this.missouristate = {
  CourseInfo: function(title, description) {
    var i, info, key, len, matchPreq, test, value;
    if (noCourseRE.test(title)) {
      return resultCourse(false);
    } else if (matchPreq = prereqRE.exec(description)) {
      matchPreq = matchPreq[1];
      info = {};
      for (i = 0, len = prereqtests.length; i < len; i++) {
        test = prereqtests[i];
        test(info, matchPreq);
      }
      for (key in info) {
        value = info[key];
        if (Object.keys(value).length === 0) {
          delete info[key];
        }
      }
      return resultCourse({
        title: title,
        description: description,
        prereq: info
      });
    } else {
      return resultCourse({
        title: title,
        description: description,
        prereq: false
      });
    }
  }
};
