var App, Data, Display, Factory, Utility;

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
  },
  dragMoveListener: function(event) {
    var target, x, y;
    target = event.target;
    x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
    target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    target.setAttribute('data-x', x);
    return target.setAttribute('data-y', y);
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
  replaceCourseLinks: function(string) {
    var course_id_re_g;
    course_id_re_g = /([A-Z]{3}) ?(\d{2,3})/g;
    return string.replace(course_id_re_g, "<span data-link=\"$1$2\">$1 $2</span>");
  },
  createHistoryEntry: function(course_id) {
    var div;
    div = document.createElement("DIV");
    div.innerHTML = '<span class="close">x</span>';
    $(div).prepend(Factory.replaceCourseLinks(Data.getCourseById(course_id).title));
    return div;
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
    last_search_query: null
  },
  openCourse: function(course_id, maximized) {
    var $centerCourses, courseBox, course_info, x, y;
    if (maximized == null) {
      maximized = true;
    }
    $("#course-history>div").prepend(Factory.createHistoryEntry(course_id));
    Display.data.current_course = course_id;
    course_info = Data.getCourseById(course_id);
    courseBox = Factory.createCourseInfoBox(course_info);
    if (!maximized) {
      $(courseBox).addClass("minimized");
    }
    $centerCourses = $(".center-courses");
    $centerCourses.append(courseBox);
    interact(courseBox).draggable({
      snap: {
        targets: [
          interact.createSnapGrid({
            x: 100,
            y: 100
          })
        ],
        range: Infinity,
        relativePoints: [
          {
            x: 0,
            y: 0
          }
        ]
      },
      restrict: {
        restriction: "parent",
        endOnly: true,
        elementRect: {
          top: 0,
          left: 0,
          bottom: 1,
          right: 1
        }
      },
      onmove: Utility.dragMoveListener
    });
    x = $centerCourses.width() - courseBox.offsetWidth;
    y = $centerCourses.height() - courseBox.offsetHeight;
    return Utility.dragMoveListener({
      target: courseBox,
      dx: x / 2,
      dy: y / 2
    });
  },
  updateHoverInfo: function(course_id) {
    Display.data.hoverElement.innerHTML = "";
    Display.data.hoverElement.appendChild(Factory.createCourseInfoBox(Data.getCourseById(course_id)));
    return Display.data.hoverElement.style.display = "block";
  },
  moveHoverInfo: function(x, y) {
    var target;
    target = Display.data.hoverElement;
    if (document.body.offsetHeight < y + target.offsetHeight) {
      y = document.body.offsetHeight - target.offsetHeight;
    }
    if (document.body.offsetWidth < x + target.offsetWidth) {
      x = document.body.offsetWidth - target.offsetWidth;
    }
    return target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
  },
  closeHoverInfo: function() {
    return Display.data.hoverElement.style.display = "none";
  },
  setup: function() {
    var $search_results;
    $search_results = $("#output-search")[0];
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
    $("#output-search").on("mouseenter", "li[data-link-course-id]", function() {
      return Display.updateHoverInfo(this.dataset.linkCourseId);
    });
    $("body").on("mousemove", "[data-link],#output-search>li", function(event) {
      Display.moveHoverInfo(event.clientX, event.clientY);
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
    window.app = App.setup(all_catalog);
    return Display.openCourse("CSC335");
  } else {
    throw error;
  }
});
