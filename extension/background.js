var courses_href_re, injectcss, injectjs;

injectjs = '// Link courses\nDisplay.setup = function () {\n  var lastHovered = null;\n  (function () {\n    var hoverCourse = document.createElement("DIV")\n    hoverCourse.id = "hover-info"\n    document.body.appendChild(hoverCourse);\n    hoverCourse.style.position = "fixed"\n    hoverCourse.style.top = 0\n    hoverCourse.style.left = 0\n    hoverCourse.style.pointerEvents = "none"\n    hoverCourse.className = "standalone"\n    Display.data.hoverElement = hoverCourse;\n  }());\n  _zq1("body").on("mouseover", "[data-link]", function(event) {\n    if (lastHovered == this.dataset.link)\n      return;\n    lastHovered = this.dataset.link;\n    return Display.updateHoverInfo(this.dataset.link, function () {\n        Display.moveHoverInfo(event.clientX + 10, event.clientY + 10);\n      });\n  });\n  _zq1("body").on("mousemove", "[data-link]", function(event) {\n    Display.moveHoverInfo(event.clientX + 10, event.clientY + 10);\n    return event.stopPropagation();\n  });\n  return _zq1("body").on("mousemove", function() {\n    lastHovered = null;\n    return Display.closeHoverInfo();\n  });\n}\nvar em, el, emI, ems = document.querySelectorAll("li p");\nfunction onClickLink (event) {\n  var course_id = this.dataset.link;\n  event.stopPropagation();\n  if (document.getElementById(course_id)) {\n  } else {\n    Data.getCourseHrefById(course_id, function (error, href) {\n        if (error != null)\n          console.error(error)\n        window.location.href = href\n      })\n    event.preventDefault();\n    return false;\n  }\n}\ndocument.head.appendChild(el = document.createElement("STYLE"), el.innerText="h3:target{background:yellowgreen}", el);\nvar re=/([A-Z]{3})\\s*(\\d{2,3})/g;\nfor (emI = 0; em=ems[emI], emI<ems.length; emI++){\n  if (em!=null) {\n    em.innerHTML = em.innerHTML.replace(re, function(match,dep,num){\n      var temp = dep+num;\n      return temp.replace(re,"<a href=\'#$1$2\' data-link=\'$1$2\'>$1 $2</a>")\n    })\n  }\n}\nems = document.querySelectorAll("li p a[data-link]")\nfor (emI = 0; em=ems[emI], emI<ems.length; emI++){\n  if (em!=null) {\n    em.addEventListener("click", onClickLink)\n  }\n}\nDisplay.setup()\nwindow.mostateextensionapplied = true;';

$.get("./foreground-utils.js", function(error, res, data) {
  if (res === "success") {
    injectjs = data.responseText + ";" + injectjs;
    return $.get("./vendor/jquery-2.1.3-zq1.min.js", function(error, res, data) {
      if (res === "success") {
        injectjs = data.responseText + ";" + injectjs;
        return $.get("./vendor/gocoursesort.js", function(error, res, data) {
          if (res === "success") {
            return injectjs = "if (!window.mostateextensionapplied){" + data.responseText + ";" + injectjs + "}";
          } else {
            throw error;
          }
        });
      } else {
        throw error;
      }
    });
  } else {
    throw error;
  }
});

injectcss = "";

$.get("./popup.css", function(error, res, data) {
  if (res === "success") {
    return injectcss += data.responseText;
  } else {
    throw error;
  }
});

courses_href_re = /www\.missouristate\.edu\/registrar\/catalog\/\w+\.htm/;

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (((tab != null ? tab.url : void 0) != null) && courses_href_re.test(tab.url)) {
    chrome.tabs.executeScript(tabId, {
      code: injectjs
    });
    return chrome.tabs.insertCSS(tabId, {
      code: injectcss
    });
  }
});

chrome.commands.onCommand.addListener(function(command) {
  switch (command) {
    case "open-course-search":
      return chrome.tabs.executeScript({
        code: "console.log('open course sort');"
      });
  }
});
