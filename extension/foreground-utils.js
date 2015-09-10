var Data, Display, Factory, goCourseSort;

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
    title = course_info.T, course_id = course_info.I, desc = course_info.D, req = course_info.P, hours = course_info.H;
    offered = {
      Fall: course_info.O.F,
      Spring: course_info.O.S,
      Summer: course_info.O.M
    };
    html = "<h3>" + title + "</h3>\n<p class=\"desc\">" + desc + "</p>\n<div class=\"hours\">\n  <div class=\"credit-hours\">" + (hours.C || 0) + "</div>\n  <div class=\"lecture-hours\">" + (hours.E || 0) + "</div>\n  <div class=\"lab-hours\">" + (hours.L || 0) + "</div>\n</div>\n<div class=\"offered\">\n  <strong>Typically offered:&nbsp</strong>";
    ref = Object.keys(offered).filter(function(item) {
      return offered[item];
    });
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
    return Data.getCourseHrefById(course_id, function(error, href) {
      if (error != null) {
        console.error(error);
      }
      chrome.tabs.create({
        url: href
      });
      return window.close();
    });
  },
  updateHoverInfo: function(course_id, done) {
    return Data.getCourseById(course_id, function(error, info) {
      if (error != null) {
        console.error(error);
        info = null;
      }
      if (info === null) {
        Display.data.hoverElement.innerHTML = "<em style='padding:.5em;display:block;background:white;color:darkred'>Course could not be found.</em>";
      } else {
        Display.data.hoverElement.innerHTML = "";
        Display.data.hoverElement.appendChild(Factory.createCourseInfoBox(info));
      }
      Display.data.hoverElement.style.display = "block";
      if (typeof done === "function") {
        return done();
      }
    });
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
  }
};

goCourseSort = new GoCourseSort("ws://catalog.mostate.io/websocket");

Data = {
  getCourseById: function(course_id, callback) {
    return goCourseSort.get(course_id, callback);
  },
  getCourseHrefById: function(course_id, callback) {
    return goCourseSort.get(course_id, function(error, course) {
      if (error != null) {
        return callback(error);
      } else {
        return callback(null, "http://www.missouristate.edu/registrar/catalog/" + course.L + ".htm\#" + course.I);
      }
    });
  },
  searchCourseTitles: function(str, callback) {
    return goCourseSort.search(str, callback);
  }
};
