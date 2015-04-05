var App, Data, Display, Factory, Utility;

Utility = {
  course_id_re: /([A-Z]{3}) ?(\d{3})/,
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

Factory = {
  createSearchResultLi: function(title) {
    var li;
    li = document.createElement("LI");
    li.innerHTML = title;
    li.dataset.linkCourseId = Utility.getCourseIdFromString(title);
    return li;
  },
  createCourseLink: function(course_id) {
    var span;
    span = document.createElement("SPAN");
    span.dataset.link = course_id;
    span.innerText = course_id.slice(0, 3) + " " + course_id.slice(3, 7);
    return span;
  },
  createHistoryEntry: function(course_id) {
    var span;
    span = document.createElement("SPAN");
    span.innerHTML = '<span class="close">x</span>';
    $(span).prepend(Factory.createCourseLink(course_id));
    return span;
  },
  createCourseInfoBox: function(course_info) {
    var course_id, desc, div_container, hours, html, i, j, len, offer, offered, ref, req, title;
    div_container = document.createElement("DIV");
    title = course_info.title, course_id = course_info.course_id, desc = course_info.desc, req = course_info.req, hours = course_info.hours, offered = course_info.offered;
    html = "<h3>" + title + "</h3>\n" + ((req != null) ? '<p class="req">' + req + '</p>' : '') + "\n<p class=\"desc\">" + desc + "</p>\n<div class=\"hours\">\n  <div><strong>Credit hrs:&nbsp;</strong>" + (hours.credit || 0) + "</div>\n  <div><strong>Lecture hrs:&nbsp;</strong>" + (hours.lecture || 0) + "</div>\n  <div><strong>Lab hrs:&nbsp;</strong>" + (hours.lab || 0) + "</div>\n</div>\n<div class=\"offered\">\n  <strong>Typically offered:&nbsp;</strong>";
    ref = Object.keys(offered);
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      offer = ref[i];
      if (i > 0) {
        html += ", ";
      }
      html += "<span>" + offer + "</span>";
    }
    html += "</div>";
    div_container.innerHTML = html;
    div_container.course_info = course_info;
    div_container.className = "course-info";
    return div_container;
  }
};

Display = {
  data: {
    search_debounce_timer_id: null,
    last_search_query: null,
    current_course: null
  },
  openCourse: function(course_id) {
    var course_info;
    if (Display.data.current_course != null) {
      if (Display.data.current_course === course_id) {
        return;
      }
      $("#course-history>div").prepend(Factory.createHistoryEntry(Display.data.current_course));
    }
    Display.data.current_course = course_id;
    course_info = Data.getCourseById(course_id);
    return $("#course-list").html(Factory.createCourseInfoBox(course_info));
  },
  setup: function() {
    var $course_list, $search_results;
    $search_results = $("#output-search")[0];
    $course_list = $("#course-list")[0];
    $("#course-search").on("keyup", function(event) {
      var debounceMs;
      clearTimeout(Display.data.search_debounce_timer_id);
      if (event.which === 13) {
        debounceMs = 10;
      } else {
        debounceMs = 500;
      }
      return Display.data.search_debounce_timer_id = setTimeout(function(search_query) {
        var j, len, ref, results, title;
        if (Display.data.last_search_query !== search_query) {
          Display.data.last_search_query = search_query;
          $search_results.innerHTML = "";
          ref = Data.searchCourseTitles(search_query);
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            title = ref[j];
            results.push($search_results.appendChild(Factory.createSearchResultLi(title)));
          }
          return results;
        }
      }, debounceMs, this.value);
    });
    $($search_results).on("click", "li", function() {
      return Display.openCourse(this.dataset.linkCourseId);
    });
    $($course_list).on("click", "span[data-link]", function() {
      return Display.openCourse(this.dataset.link);
    });
    $("#course-history").on("click", "span[data-link]", function() {
      return Display.openCourse(this.dataset.link);
    });
    return $("#course-history").on("click", ".close", function() {
      return this.parentNode.remove();
    });
  }
};

Data = {
  data: {
    all_catalog: null,
    course_id_to_course: {},
    search_index: [],
    fuse_search: null
  },
  setup: function(all_catalog_obj) {
    var course, course_id, courses, key;
    Data.data.all_catalog = all_catalog_obj;
    for (key in all_catalog_obj) {
      courses = all_catalog_obj[key];
      for (course_id in courses) {
        course = courses[course_id];
        Data.data.course_id_to_course[course_id] = course;
        Data.data.search_index.push({
          id: course_id,
          title: course.title.replace(Utility.course_id_re, "")
        });
      }
    }
    return Data.data.fuse_search = new Fuse(Data.data.search_index, {
      distance: 1000,
      threshold: .2,
      id: "id",
      keys: ["id", "title"]
    });
  },
  getCourseById: function(course_id) {
    return Data.data.course_id_to_course[course_id];
  },
  getCourseByTitle: function(title) {
    var course_id;
    course_id = Utility.getCourseIdFromString(title);
    return Data.getCourseById(course_id);
  },
  searchCourseTitles: function(str) {
    var course_ids, gCBI, id, j, len, results;
    course_ids = Data.data.fuse_search.search(str);
    gCBI = Data.getCourseById;
    results = [];
    for (j = 0, len = course_ids.length; j < len; j++) {
      id = course_ids[j];
      results.push(gCBI(id).title);
    }
    return results;
  }
};

App = {
  setup: function(all_catalog_obj) {
    Data.setup(all_catalog_obj);
    return Display.setup();
  }
};

$.getJSON("./all_catalog.json", function(error, res, data) {
  var all_catalog;
  if (res === "success") {
    all_catalog = data.responseJSON;
    window.app = App.setup(all_catalog);
    return Display.openCourse("CSC335");
  } else {
    throw error;
  }
});
