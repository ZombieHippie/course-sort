# Utilities used in both the popup and client

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
    {T: title, I: course_id, D: desc, P: req, H: hours } = course_info
    offered = {
      Fall: course_info.O.F
      Spring: course_info.O.S
      Summer: course_info.O.M
    }
    html = """
    <h3>#{title}</h3>
    <p class="desc">#{desc}</p>
    <div class="hours">
      <div class="credit-hours">#{hours.C or 0}</div>
      <div class="lecture-hours">#{hours.E or 0}</div>
      <div class="lab-hours">#{hours.L or 0}</div>
    </div>
    <div class="offered">
      <strong>Typically offered:&nbsp</strong>
    """
    for offer, i in Object.keys(offered).filter((item) -> offered[item])
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
    Data.getCourseHrefById course_id, (error, href) ->
      if error?
        console.error error
      chrome.tabs.create {url: href}
      window.close()

  updateHoverInfo: (course_id, done) ->
    Data.getCourseById course_id, (error, info) ->
      if error?
        console.error error
        info = null
      if info == null
        Display.data.hoverElement.innerHTML = "<em style='padding:.5em;display:block;background:white;color:darkred'>Course could not be found.</em>"
      else
        Display.data.hoverElement.innerHTML = ""
        Display.data.hoverElement.appendChild Factory.createCourseInfoBox info
      Display.data.hoverElement.style.display = "block"
      if typeof done is "function"
        done()

  moveHoverInfo: (x, y) ->
    target = Display.data.hoverElement
    # ensure that most of #hover-info is going to be in the window
    if document.body.offsetHeight < y + target.offsetHeight
      y = document.body.offsetHeight - target.offsetHeight
    if document.body.offsetWidth < x + target.offsetWidth
      x = document.body.offsetWidth - target.offsetWidth
    target.style.webkitTransform =
    target.style.transform =
      'translate(' + x + 'px, ' + y + 'px)'

  closeHoverInfo: ->
    Display.data.hoverElement.style.display = "none"


goCourseSort = new GoCourseSort("ws://catalog.mostate.io/websocket")

Data =
  getCourseById: (course_id, callback) ->
    goCourseSort.get(course_id, callback)

  getCourseHrefById: (course_id, callback) ->
    goCourseSort.get course_id, (error, course) ->
      if error? then callback error
      else callback null,"http://www.missouristate.edu/registrar/catalog/#{course.L}.htm\##{course.I}"

  searchCourseTitles: (str, callback) ->
    goCourseSort.search str, callback
