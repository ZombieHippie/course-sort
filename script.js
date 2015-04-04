var App, Data, Display, Utility;

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

Display = {
  data: {
    search_debounce_timer_id: null,
    last_search_query: null
  },
  setup: function() {
    var $output;
    $output = $("#output-search")[0];
    $("#course-search").on("keyup", function(event) {
      var debounceMs;
      clearTimeout(Display.data.search_debounce_timer_id);
      if (event.which === 13) {
        debounceMs = 0;
      } else {
        debounceMs = 500;
      }
      return Display.data.search_debounce_timer_id = setTimeout(function(search_query) {
        var i, len, li, ref, results, title;
        if (Display.data.last_search_query !== search_query) {
          Display.data.last_search_query = search_query;
          $output.innerHTML = "";
          ref = Data.searchCourseTitles(search_query);
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            title = ref[i];
            li = document.createElement("LI");
            li.innerHTML = title;
            li.dataset.linkCourseId = Utility.getCourseIdFromString(title);
            results.push($output.appendChild(li));
          }
          return results;
        }
      }, debounceMs, this.value);
    });
    return $($output).on("click", "li", function() {
      var courseJSON;
      courseJSON = JSON.stringify(Data.getCourseById(this.dataset.linkCourseId), null, 2);
      return $("#course-list").text(courseJSON);
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
