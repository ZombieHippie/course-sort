# start building injectjs
injectjs = '''
// Link courses
Display.setup = function () {
  var lastHovered = null;
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
  _zq1("body").on("mouseover", "[data-link]", function(event) {
    if (lastHovered == this.dataset.link)
      return;
    lastHovered = this.dataset.link;
    return Display.updateHoverInfo(this.dataset.link, function () {
        Display.moveHoverInfo(event.clientX + 10, event.clientY + 10);
      });
  });
  _zq1("body").on("mousemove", "[data-link]", function(event) {
    Display.moveHoverInfo(event.clientX + 10, event.clientY + 10);
    return event.stopPropagation();
  });
  return _zq1("body").on("mousemove", function() {
    lastHovered = null;
    return Display.closeHoverInfo();
  });
}
var em, el, emI, ems = document.querySelectorAll("li p");
function onClickLink (event) {
  var course_id = this.dataset.link;
  event.stopPropagation();
  if (document.getElementById(course_id)) {
  } else {
    Data.getCourseHrefById(course_id, function (error, href) {
        if (error != null)
          console.error(error)
        window.location.href = href
      })
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
        injectjs = data.responseText + ";" + injectjs
        # add gocoursesort to injection js
        $.get "./vendor/gocoursesort.js", (error, res, data) ->
          if res is "success"
            # add gocoursesort to injection js
            injectjs = "if (!window.mostateextensionapplied){" + data.responseText + ";" + injectjs + "}"

          else
            throw error

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

courses_href_re = /www\.missouristate\.edu\/registrar\/catalog\/\w+\.htm/
chrome.tabs.onUpdated.addListener (tabId, changeInfo, tab)->
  if tab?.url? and courses_href_re.test tab.url
    chrome.tabs.executeScript(tabId, {
      code: injectjs
    })
    chrome.tabs.insertCSS(tabId, {
      code: injectcss
    })

chrome.commands.onCommand.addListener (command) ->
  switch command
    when "open-course-search"
      # inject html
      chrome.tabs.executeScript({
        code: "console.log('open course sort');"
      })