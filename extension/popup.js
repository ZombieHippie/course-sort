var search_el;

Display.setup = function() {
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
      if (Display.data.last_search_query !== search_query) {
        Display.data.last_search_query = search_query;
        $search_results.innerHTML = "";
        return Data.searchCourseTitles(search_query, function(error, response) {
          var course, i, len, ref, results;
          if (error != null) {
            return $search_results.innerHTML = String(error);
          } else {
            if (response.Results.length > 0) {
              ref = response.Results;
              results = [];
              for (i = 0, len = ref.length; i < len; i++) {
                course = ref[i];
                results.push($search_results.appendChild(Factory.createSearchResultLi(course.T)));
              }
              return results;
            } else {
              return $search_results.innerHTML = "<li><em style='padding:.5em;display:block;background:white;color:darkred'>Sorry, no courses found using \"" + search_query + "\".</em></li>";
            }
          }
        });
      }
    }, debounceMs, this.value);
  });
  $($search_results).on("click", "li[data-link-course-id]", function() {
    return Display.openCourse(this.dataset.linkCourseId);
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
};

Display.setup();

search_el = document.getElementById('course-search');

search_el.focus();
