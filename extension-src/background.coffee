# var re = /\b(\w{3}) ?(\d{2,3})\b/, h = $("li").filter(function(){return re.test(this.innerText)})

Data =
  data:
    prefix_to_dept: null
    course_id_to_course: {}
    search_index: []
    fuse_search: null

  setup: (all_catalog_obj) ->
    Data.data.prefix_to_dept = {}
    for department, courses of all_catalog_obj
      for course_id, course of courses
        course_prefix = course_id[..2]
        if not Data.data.prefix_to_dept[course_prefix]?
          Data.data.prefix_to_dept[course_prefix] = department
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

  getCourseHrefById: (course_id) ->
    course_prefix = course_id[..2]
    dept = Data.data.prefix_to_dept[course_prefix]
    "http://www.missouristate.edu/registrar/catalog/#{dept}.htm\##{course_id}"

  getCourseByTitle: (title) ->
    course_id = Utility.getCourseIdFromString(title)
    Data.getCourseById course_id

  searchCourseTitles: (str) ->
    course_ids = Data.data.fuse_search.search(str)
    gCBI = Data.getCourseById
    gCBI(id).title for id in course_ids


# start building injectjs
injectjs = '''
// Link courses
Display.setup = function () {
  (function () {
    var hoverCourse = document.createElement("DIV")
    hoverCourse.id = "hover-info"
    document.body.appendChild(hoverCourse);
    hoverCourse.style.position = "fixed"
    hoverCourse.style.top = 0
    hoverCourse.style.left = 0
    hoverCourse.style.pointerEvents = "none"
    hoverCourse.className = "standalone"
    Display.data.hoverElement = hoverCourse;
  }());
  _zq1("body").on("mouseenter", "[data-link]", function() {
    return Display.updateHoverInfo(this.dataset.link);
  });
  _zq1("body").on("mousemove", "[data-link]", function(event) {
    Display.moveHoverInfo(event.clientX + 10, event.clientY + 10);
    return event.stopPropagation();
  });
  return _zq1("body").on("mousemove", function() {
    return Display.closeHoverInfo();
  });
}
var em, el, emI, ems = document.querySelectorAll("li p");
function onClickLink (event) {
  var course_id = this.dataset.link;
  event.stopPropagation();
  if (document.getElementById(course_id)) {
  } else {
    chrome.runtime.sendMessage({type: "lookup-href", data: course_id}, function (response) {
      window.location.href = response.result
    });
    event.preventDefault();
    return false;
  }
}
document.head.appendChild(el = document.createElement("STYLE"), el.innerText="h3:target{background:yellowgreen}", el);
var re=/([A-Z]{3})\\s*(\\d{2,3})/g;
for (emI = 0; em=ems[emI], emI<ems.length; emI++){
  if (em!=null) {
    em.innerHTML = em.innerHTML.replace(re, function(match,dep,num){
      var temp = dep+num;
      return temp.replace(re,"<a href='#$1$2' data-link='$1$2'>$1 $2</a>")
    })
  }
}
ems = document.querySelectorAll("li p a[data-link]")
for (emI = 0; em=ems[emI], emI<ems.length; emI++){
  if (em!=null) {
    em.addEventListener("click", onClickLink)
  }
}
Display.setup()
window.mostateextensionapplied = true;
'''

# add foreground-utils to injection js 
$.get "./foreground-utils.js", (error, res, data) ->
  if res is "success"
    injectjs = data.responseText + ";" + injectjs
    # add jQuery to injection js 
    $.get "./vendor/jquery-2.1.3-zq1.min.js", (error, res, data) ->
      if res is "success"
        injectjs = "if (!window.mostateextensionapplied){" + data.responseText + ";" + injectjs + "}"

      else
        throw error

  else
    throw error

# add popup css to injection css (for hover element) 
injectcss = ""
$.get "./popup.css", (error, res, data) ->
  if res is "success"
    injectcss += data.responseText

  else
    throw error

$.getJSON "./all_catalog.json", (error, res, data) ->
  if res is "success"
    all_catalog = data.responseJSON
    Data.setup(all_catalog)
    chrome.runtime.onMessage.addListener (request, sender, sendResponse) ->
      if (request.type)
        switch request.type
          when "lookup-info"
            course_id = request.data
            sendResponse(result: Data.getCourseById(course_id))
          when "lookup-href"
            course_id = request.data
            sendResponse(result: Data.getCourseHrefById(course_id))
          when "search"
            str = request.data
            sendResponse(result: Data.searchCourseTitles(str))

  else
    throw error

courses_href_re = /www\.missouristate\.edu\/registrar\/catalog\/\w+\.htm/
chrome.tabs.onUpdated.addListener (tabId, changeInfo, tab)->
  if tab?.url? and courses_href_re.test tab.url
    chrome.tabs.executeScript({
      code: injectjs
    })
    chrome.tabs.insertCSS({
      code: injectcss
    })
