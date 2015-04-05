
Utility =
  course_id_re: /([A-Z]{3}) ?(\d{3})/
  getCourseIdFromString: (str) ->
    match = str.match Utility.course_id_re
    if match?
      match[1] + match[2]
    else
      throw "String did not match course id!"

Factory =
  createSearchResultLi: (title) ->
    li = document.createElement("LI")
    li.innerHTML = title
    li.dataset.linkCourseId = Utility.getCourseIdFromString title
    return li

  createCourseLink: (course_id) ->
    span = document.createElement("SPAN")
    span.dataset.link = course_id
    span.innerText = course_id[0..2] + " " + course_id[3..6]
    return span

  createHistoryEntry: (course_id) ->
    span = document.createElement("SPAN")
    span.innerHTML = '<span class="close">x</span>'
    $(span).prepend Factory.createCourseLink course_id
    return span

  createCourseInfoBox: (course_info) ->
    div_container = document.createElement("DIV")
    {title, course_id, desc, req, hours, offered } = course_info
    html = """
    <h3>#{title}</h3>
    #{if (req?) then '<p class="req">' + req + '</p>' else ''}
    <p class="desc">#{desc}</p>
    <div class="hours">
      <div><strong>Credit hrs:&nbsp;</strong>#{hours.credit or 0}</div>
      <div><strong>Lecture hrs:&nbsp;</strong>#{hours.lecture or 0}</div>
      <div><strong>Lab hrs:&nbsp;</strong>#{hours.lab or 0}</div>
    </div>
    <div class="offered">
      <strong>Typically offered:&nbsp;</strong>
    """
    for offer, i in Object.keys(offered)
      if i > 0
        html += ", "
      html += "<span>#{offer}</span>"
    html += "</div>"
    div_container.innerHTML = html
    div_container.course_info = course_info
    div_container.className = "course-info"
    return div_container


Display =
  data:
    search_debounce_timer_id: null
    last_search_query: null
    current_course: null

  openCourse: (course_id) ->
    if Display.data.current_course?
      if Display.data.current_course is course_id
        return
      $("#course-history>div").prepend Factory.createHistoryEntry Display.data.current_course
    Display.data.current_course = course_id
    course_info = Data.getCourseById(course_id)
    $("#course-list").html(Factory.createCourseInfoBox course_info)

  setup: ->
    # Search input
    $search_results = $("#output-search")[0]
    $course_list = $("#course-list")[0]
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

    $($course_list).on "click", "span[data-link]", ->
      Display.openCourse(@dataset.link)

    $("#course-history").on "click", "span[data-link]", ->
      Display.openCourse(@dataset.link)

    $("#course-history").on "click", ".close", ->
      @parentNode.remove()

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
    # test
    Display.openCourse "CSC335"

  else
    throw error