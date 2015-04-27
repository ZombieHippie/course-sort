var Data, courses_href_re, injectcss, injectjs;

Data = {
  data: {
    prefix_to_dept: null,
    course_id_to_course: {},
    search_index: [],
    fuse_search: null
  },
  setup: function(all_catalog_obj) {
    var course, course_id, course_prefix, courses, department;
    Data.data.prefix_to_dept = {};
    for (department in all_catalog_obj) {
      courses = all_catalog_obj[department];
      for (course_id in courses) {
        course = courses[course_id];
        course_prefix = course_id.slice(0, 3);
        if (Data.data.prefix_to_dept[course_prefix] == null) {
          Data.data.prefix_to_dept[course_prefix] = department;
        }
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
  getCourseHrefById: function(course_id) {
    var course_prefix, dept;
    course_prefix = course_id.slice(0, 3);
    dept = Data.data.prefix_to_dept[course_prefix];
    return "http://www.missouristate.edu/registrar/catalog/" + dept + ".htm\#" + course_id;
  },
  getCourseByTitle: function(title) {
    var course_id;
    course_id = Utility.getCourseIdFromString(title);
    return Data.getCourseById(course_id);
  },
  searchCourseTitles: function(str) {
    var course_ids, gCBI, i, id, len, results;
    course_ids = Data.data.fuse_search.search(str);
    gCBI = Data.getCourseById;
    results = [];
    for (i = 0, len = course_ids.length; i < len; i++) {
      id = course_ids[i];
      results.push(gCBI(id).title);
    }
    return results;
  }
};

injectjs = '// Link courses\nDisplay.setup = function () {\n  var lastHovered = null;\n  (function () {\n    var hoverCourse = document.createElement("DIV")\n    hoverCourse.id = "hover-info"\n    document.body.appendChild(hoverCourse);\n    hoverCourse.style.position = "fixed"\n    hoverCourse.style.top = 0\n    hoverCourse.style.left = 0\n    hoverCourse.style.pointerEvents = "none"\n    hoverCourse.className = "standalone"\n    Display.data.hoverElement = hoverCourse;\n  }());\n  _zq1("body").on("mouseover", "[data-link]", function() {\n    if (lastHovered == this.dataset.link)\n      return;\n    lastHovered = this.dataset.link;\n    return Display.updateHoverInfo(this.dataset.link);\n  });\n  _zq1("body").on("mousemove", "[data-link]", function(event) {\n    Display.moveHoverInfo(event.clientX + 10, event.clientY + 10);\n    return event.stopPropagation();\n  });\n  return _zq1("body").on("mousemove", function() {\n    lastHovered = null;\n    return Display.closeHoverInfo();\n  });\n}\nvar em, el, emI, ems = document.querySelectorAll("li p");\nfunction onClickLink (event) {\n  var course_id = this.dataset.link;\n  event.stopPropagation();\n  if (document.getElementById(course_id)) {\n  } else {\n    chrome.runtime.sendMessage({type: "lookup-href", data: course_id}, function (response) {\n      window.location.href = response.result\n    });\n    event.preventDefault();\n    return false;\n  }\n}\ndocument.head.appendChild(el = document.createElement("STYLE"), el.innerText="h3:target{background:yellowgreen}", el);\nvar re=/([A-Z]{3})\\s*(\\d{2,3})/g;\nfor (emI = 0; em=ems[emI], emI<ems.length; emI++){\n  if (em!=null) {\n    em.innerHTML = em.innerHTML.replace(re, function(match,dep,num){\n      var temp = dep+num;\n      return temp.replace(re,"<a href=\'#$1$2\' data-link=\'$1$2\'>$1 $2</a>")\n    })\n  }\n}\nems = document.querySelectorAll("li p a[data-link]")\nfor (emI = 0; em=ems[emI], emI<ems.length; emI++){\n  if (em!=null) {\n    em.addEventListener("click", onClickLink)\n  }\n}\nDisplay.setup()\nwindow.mostateextensionapplied = true;';

$.get("./foreground-utils.js", function(error, res, data) {
  if (res === "success") {
    injectjs = data.responseText + ";" + injectjs;
    return $.get("./vendor/jquery-2.1.3-zq1.min.js", function(error, res, data) {
      if (res === "success") {
        return injectjs = "if (!window.mostateextensionapplied){" + data.responseText + ";" + injectjs + "}";
      } else {
        throw error;
      }
    });
  } else {
    throw error;
  }
});

injectcss = "";

$.get("./popup.css", function(error, res, data) {
  if (res === "success") {
    return injectcss += data.responseText;
  } else {
    throw error;
  }
});

$.getJSON("./all_catalog.json", function(error, res, data) {
  var all_catalog;
  if (res === "success") {
    all_catalog = data.responseJSON;
    Data.setup(all_catalog);
    return chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      var course_id, str;
      if (request.type) {
        switch (request.type) {
          case "lookup-info":
            course_id = request.data;
            return sendResponse({
              result: Data.getCourseById(course_id) || null
            });
          case "lookup-href":
            course_id = request.data;
            return sendResponse({
              result: Data.getCourseHrefById(course_id)
            });
          case "search":
            str = request.data;
            return sendResponse({
              result: Data.searchCourseTitles(str)
            });
        }
      }
    });
  } else {
    throw error;
  }
});

courses_href_re = /www\.missouristate\.edu\/registrar\/catalog\/\w+\.htm/;

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (((tab != null ? tab.url : void 0) != null) && courses_href_re.test(tab.url)) {
    chrome.tabs.executeScript(tabId, {
      code: injectjs
    });
    return chrome.tabs.insertCSS(tabId, {
      code: injectcss
    });
  }
});

chrome.commands.onCommand.addListener(function(command) {
  switch (command) {
    case "open-course-search":
      return chrome.tabs.executeScript({
        code: "console.log('open course sort');"
      });
  }
});
