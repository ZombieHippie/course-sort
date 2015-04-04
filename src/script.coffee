
Utility =
  course_id_re: /([A-Z]{3}) ?(\d{3})/
  getCourseIdFromString: (str) ->
    match = str.match Utility.course_id_re
    if match?
      match[1] + match[2]
    else
      throw "String did not match course id!"

Display =
  data:
    search_debounce_timer_id: null
    last_search_query: null
  setup: ->
    $output = $("#output-search")[0]
    $("#course-search").on "keyup", ->
      clearTimeout Display.data.search_debounce_timer_id
      Display.data.search_debounce_timer_id = setTimeout(
        (search_query) ->
          if Display.data.last_search_query isnt search_query
            Display.data.last_search_query = search_query
            $output.innerHTML = ""
            for title in Data.searchCourseTitles(search_query)
              li = document.createElement("LI")
              li.innerHTML = title
              li.dataset.linkCourseId = Utility.getCourseIdFromString title
              $output.appendChild li
        , 500, @value)

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