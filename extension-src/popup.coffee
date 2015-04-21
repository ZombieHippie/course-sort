# Code executed in the popup

click = (e) ->
  chrome.tabs.executeScript(null,
      {code:"document.body.style.backgroundColor='" + e.target.id + "'"})
  window.close()


Utility =
  course_id_re: /([A-Z]{3}) ?(\d{2,3})/
  getCourseIdFromString: (str) ->
    match = str.match Utility.course_id_re
    if match?
      match[1] + match[2]
    else
      throw "String did not match course id!"

Factory =
  createSearchResultLi: (title) ->
    li = document.createElement("LI")
    li.innerHTML = title.replace(Utility.course_id_re, "<strong>$1 $2</strong>")
    li.dataset.linkCourseId = Utility.getCourseIdFromString title
    return li

  replaceCourseLinks: (string) ->
    course_id_re_g = /([A-Z]{3}) ?(\d{2,3})/g
    return string.replace course_id_re_g, "<span data-link=\"$1$2\">$1 $2</span>"

  createCourseInfoBox: (course_info) ->
    div_container = document.createElement("DIV")
    {title, course_id, desc, req, hours, offered } = course_info
    html = """
    <h3>#{title}</h3>
    <p class="desc">#{desc}</p>
    <div class="hours">
      <div class="credit-hours">#{hours.credit or 0}</div>
      <div class="lecture-hours">#{hours.lecture or 0}</div>
      <div class="lab-hours">#{hours.lab or 0}</div>
    </div>
    <div class="offered">
      <strong>Typically offered:&nbsp</strong>
    """
    for offer, i in Object.keys(offered)
      if i > 0
        html += ", "
      html += "<span>#{offer}</span>"
    html += "</div>"
    if req?
      html += '<div class="req">' + req + '</div>'
    html += "<div class=\"close minimize\">-</div>"
    html += "<div class=\"close close-btn\">x</div>"
    div_container.innerHTML = html
    div_container.course_info = course_info
    div_container.className = "course-info draggable"
    return div_container


Display =
  data:
    search_debounce_timer_id: null
    last_search_query: null
    hoverElement: null

  openCourse: (course_id, maximized=true) ->
    console.log "nah"
    ###
    Display.data.current_course = course_id
    course_info = Data.getCourseById(course_id)
    courseBox = Factory.createCourseInfoBox course_info
    if not maximized
      $(courseBox).addClass "minimized"
    $centerCourses = $(".center-courses")
    $centerCourses.append(courseBox)
    ###
  updateHoverInfo: (course_id) ->
    console.log "hover: " + course_id
    Display.data.hoverElement.innerHTML = ""
    Display.data.hoverElement.appendChild Factory.createCourseInfoBox Data.getCourseById course_id
    Display.data.hoverElement.style.display = "block"
  closeHoverInfo: ->
    Display.data.hoverElement.style.display = "none"
  setup: ->
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
            for title in Data.searchCourseTitles(search_query)
              $search_results.appendChild Factory.createSearchResultLi(title)
        , debounceMs, @value)

    # Bind to links
    $($search_results).on "click", "li", ->
      Display.openCourse(@dataset.linkCourseId)

    $(".center-courses").on "click", "span[data-link]", ->
      Display.openCourse(@dataset.link, false)

    $("#course-history").on "click", "span[data-link]", ->
      Display.openCourse(@dataset.link, false)

    $("#course-history").on "click", ".close", ->
      $(@).parents("div").eq(0).remove()

    $("body").on "click", ".course-info .minimize", ->
      $(@).parents(".course-info").toggleClass("minimized")
    $("body").on "click", ".course-info .close-btn", ->
      $(@).parents(".course-info").remove()

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


Data =
  data:
    all_catalog: null
    course_id_to_course: {}
    search_index: []
    fuse_search: null
  setup: (all_catalog_obj) ->
    Data.data.all_catalog = all_catalog_obj
    for key, courses of all_catalog_obj
      for course_id, course of courses
        Data.data.course_id_to_course[course_id] = course
        Data.data.search_index.push({
          id: course_id
          title: course.title.replace(Utility.course_id_re, "")
        })
    # Fuse is used for searching by title
    Data.data.fuse_search = new Fuse(Data.data.search_index, {
        #location: 10
        distance: 1000
        threshold: .2
        id: "id"
        keys: ["id", "title"]
      })

  getCourseById: (course_id) ->
    Data.data.course_id_to_course[course_id]

  getCourseByTitle: (title) ->
    course_id = Utility.getCourseIdFromString(title)
    Data.getCourseById course_id

  searchCourseTitles: (str) ->
    course_ids = Data.data.fuse_search.search(str)
    gCBI = Data.getCourseById
    gCBI(id).title for id in course_ids

App =
  setup: (all_catalog_obj) ->
    Data.setup(all_catalog_obj)
    Display.setup()




$.getJSON "./all_catalog.json", (error, res, data) ->
  if res is "success"
    all_catalog = data.responseJSON
    window.app = App.setup(all_catalog)

  else
    throw error

#document.addEventListener 'DOMContentLoaded', ->
search_el = document.getElementById('course-search')
search_el.focus()