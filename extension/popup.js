var App, Data, Display, Factory, Utility, click, search_el;

click = function(e) {
  chrome.tabs.executeScript(null, {
    code: "document.body.style.backgroundColor='" + e.target.id + "'"
  });
  return window.close();
};

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

Factory = {
  createSearchResultLi: function(title) {
    var li;
    li = document.createElement("LI");
    li.innerHTML = title.replace(Utility.course_id_re, "<strong>$1 $2</strong>");
    li.dataset.linkCourseId = Utility.getCourseIdFromString(title);
    return li;
  },
  replaceCourseLinks: function(string) {
    var course_id_re_g;
    course_id_re_g = /([A-Z]{3}) ?(\d{2,3})/g;
    return string.replace(course_id_re_g, "<span data-link=\"$1$2\">$1 $2</span>");
  },
  createCourseInfoBox: function(course_info) {
    var course_id, desc, div_container, hours, html, i, j, len, offer, offered, ref, req, title;
    div_container = document.createElement("DIV");
    title = course_info.title, course_id = course_info.course_id, desc = course_info.desc, req = course_info.req, hours = course_info.hours, offered = course_info.offered;
    html = "<h3>" + title + "</h3>\n<p class=\"desc\">" + desc + "</p>\n<div class=\"hours\">\n  <div class=\"credit-hours\">" + (hours.credit || 0) + "</div>\n  <div class=\"lecture-hours\">" + (hours.lecture || 0) + "</div>\n  <div class=\"lab-hours\">" + (hours.lab || 0) + "</div>\n</div>\n<div class=\"offered\">\n  <strong>Typically offered:&nbsp</strong>";
    ref = Object.keys(offered);
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      offer = ref[i];
      if (i > 0) {
        html += ", ";
      }
      html += "<span>" + offer + "</span>";
    }
    html += "</div>";
    if (req != null) {
      html += '<div class="req">' + req + '</div>';
    }
    html += "<div class=\"close minimize\">-</div>";
    html += "<div class=\"close close-btn\">x</div>";
    div_container.innerHTML = html;
    div_container.course_info = course_info;
    div_container.className = "course-info draggable";
    return div_container;
  }
};

Display = {
  data: {
    search_debounce_timer_id: null,
    last_search_query: null,
    hoverElement: null
  },
  openCourse: function(course_id, maximized) {
    if (maximized == null) {
      maximized = true;
    }
    return console.log("nah");

    /*
    Display.data.current_course = course_id
    course_info = Data.getCourseById(course_id)
    courseBox = Factory.createCourseInfoBox course_info
    if not maximized
      $(courseBox).addClass "minimized"
    $centerCourses = $(".center-courses")
    $centerCourses.append(courseBox)
     */
  },
  updateHoverInfo: function(course_id) {
    console.log("hover: " + course_id);
    Display.data.hoverElement.innerHTML = "";
    Display.data.hoverElement.appendChild(Factory.createCourseInfoBox(Data.getCourseById(course_id)));
    return Display.data.hoverElement.style.display = "block";
  },
  closeHoverInfo: function() {
    return Display.data.hoverElement.style.display = "none";
  },
  setup: function() {
    var $search_results;
    $search_results = $("#search-output")[0];
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
    $(".center-courses").on("click", "span[data-link]", function() {
      return Display.openCourse(this.dataset.link, false);
    });
    $("#course-history").on("click", "span[data-link]", function() {
      return Display.openCourse(this.dataset.link, false);
    });
    $("#course-history").on("click", ".close", function() {
      return $(this).parents("div").eq(0).remove();
    });
    $("body").on("click", ".course-info .minimize", function() {
      return $(this).parents(".course-info").toggleClass("minimized");
    });
    $("body").on("click", ".course-info .close-btn", function() {
      return $(this).parents(".course-info").remove();
    });
    Display.data.hoverElement = document.getElementById("hover-info");
    $("body").on("mouseenter", "[data-link]", function() {
      return Display.updateHoverInfo(this.dataset.link);
    });
    $("#search-output").on("mouseenter", "li[data-link-course-id]", function() {
      return Display.updateHoverInfo(this.dataset.linkCourseId);
    });
    $("body").on("mousemove", "[data-link],#search-output>li", function(event) {
      return event.stopPropagation();
    });
    return $("body").on("mousemove", function() {
      return Display.closeHoverInfo();
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
    return window.app = App.setup(all_catalog);
  } else {
    throw error;
  }
});

search_el = document.getElementById('course-search');

search_el.focus();
