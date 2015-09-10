# Code executed in the popup

# Display setup unique to popup
Display.setup = ->
  # Search input
  $search_results = $("#search-output")[0]
  $("#course-search").on "keyup", (event) ->
    clearTimeout Display.data.search_debounce_timer_id
    if event.which is 13
      # Enter key pressed
      debounceMs = 10
    else
      debounceMs = 500
    Display.data.search_debounce_timer_id = setTimeout(
      (search_query) ->
        if Display.data.last_search_query isnt search_query
          Display.data.last_search_query = search_query
          $search_results.innerHTML = ""
          Data.searchCourseTitles search_query, (error, response) ->
            if error? then $search_results.innerHTML = String(error)
            else
              if response.Results.length > 0
                for course in response.Results
                  $search_results.appendChild Factory.createSearchResultLi(course.T)
              else
                $search_results.innerHTML = "<li><em style='padding:.5em;display:block;background:white;color:darkred'>Sorry, no courses found using \"#{search_query}\".</em></li>"
      , debounceMs, @value)

  # Bind to links
  $($search_results).on "click", "li[data-link-course-id]", ->
    Display.openCourse(@dataset.linkCourseId)

  # Hover info
  Display.data.hoverElement = document.getElementById "hover-info"
  $("body").on "mouseenter", "[data-link]", ->
    Display.updateHoverInfo(@dataset.link)
  $("#search-output").on "mouseenter", "li[data-link-course-id]", ->
    Display.updateHoverInfo(@dataset.linkCourseId)
  $("body").on "mousemove", "[data-link],#search-output>li", (event)->
    event.stopPropagation()
  $("body").on "mousemove", ->
    Display.closeHoverInfo()

#document.addEventListener 'DOMContentLoaded', ->
Display.setup()
search_el = document.getElementById('course-search')
search_el.focus()