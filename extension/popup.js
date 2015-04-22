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
        return Data.searchCourseTitles(search_query, function(results) {
          var i, len, results1, title;
          results1 = [];
          for (i = 0, len = results.length; i < len; i++) {
            title = results[i];
            results1.push($search_results.appendChild(Factory.createSearchResultLi(title)));
          }
          return results1;
        });
      }
    }, debounceMs, this.value);
  });
  $($search_results).on("click", "li", function() {
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
