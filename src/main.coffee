stopEvent = (event) ->
  event.stopPropagation()
  event.preventDefault()
  return false

courseRE = /[A-Z]{3}\s?\d{3}$/

warning = $("#warning")
$("#add-course").on "submit", (event) ->
  j = this["course-name"]
  courseId = j.value
  if courseRE.test courseId
    addCourse courseId
    warning.hide()
  else
    warning
      .text("'#{courseId}' improper format. Eg: 'CSC 365'")
      .show()
  j.value = ""
  stopEvent(event)

$("#course-name").on "drop", (event) ->
  courseId = null
  console.log event.originalEvent.dataTransfer
  try
    courseId = event.originalEvent.dataTransfer.getData("text")
  catch error
    null
  if courseId?
    if courseRE.test courseId
      courseId = courseRE.exec(courseId)[0]
      addCourse courseId
    return stopEvent event

$(".course-list").on "click", "p", (event) ->
  if not $(event.target).is("em")
    $(this).toggleClass("one-high")

addCourse = (courseId) ->
  lookupCourse courseId, (obj) ->
    if obj is false
      warning
        .text("Course: '#{courseId}' does not exist")
        .show()
    else
      # Add course to sortable list
      li = listItemFactory(obj)
      $(".course-list").append li
  
this.addCourse = addCourse

# Look-up utilities

lookingUpCourse = null

lookupCourse = (courseId, callback) ->
  lookingUpCourse = callback
  $.getScript make_url(courseId), ((error, res)->)

resultCourse = (obj) ->
  lookingUpCourse obj
  lookingUpCourse = null

make_url = (course) ->
  course = encodeURIComponent(course)
  "http://missouristate.info/scripts/courseinfo.aspx?code=#{course}"

prereqRE = /Prerequisite:(.+?)<\//
quoteRE = "(?:&quot;|\")"
gradedCourses = ///
  #{quoteRE}([A-Z])#{quoteRE} \s or \s better \s in \s ([^\.;]+)
///
prereqtests = [
  (info, str)->
    # Grade requirement
    info.grades = {}
    re = new RegExp gradedCourses.source, "g"
    while match = re.exec str
      #match[2].split(/\s*and\s*/g)
      for crs in match[2].split(" or ") when courseRE.test crs.trim()
        info.grades[crs] = match[1]
  (info, str)->
    # permissions
    info.perms = {}
    re = /permissions?\sof\s([a-zA-Z\s]+)/g
    while match = re.exec str
      #match[2].split(/\s*and\s*/g)
      for entity in match[1].split(" or ")
        info.perms[entity] = true
]

listItemActions = """
  <div class='course-actions'>
    <button type="button" class="close">
      <span aria-hidden="true">×</span>
      <span class="sr-only">Close</span>
    </button>
    <div class='course-flags'></div>
  </div>
"""
listItemFactory = (obj) ->
  {title, description, prereq} = obj
  listItem = $ "<LI></LI>"
  listItem.append $ listItemActions
  titleEl = $ "<div class='course-title'>"
  titleEl.html title
  listItem.append titleEl
  descEl = $ "<div class='course-description'>"
  descEl.html description
  listItem.append descEl
  listItem


noCourseRE = /Course not found/i

# Used by loaded script
this.missouristate =
  CourseInfo: (title, description) ->
    if noCourseRE.test title
      resultCourse false
    else if matchPreq = prereqRE.exec(description)
      matchPreq = matchPreq[1]
      #Say matchPreq
      info = {}
      for test in prereqtests
        test(info, matchPreq)
      # clean
      for key, value of info
        if Object.keys(value).length is 0
          delete info[key]
      resultCourse { title, description, prereq: info }
    else
      resultCourse { title, description, prereq: false }