var courses_href_re;

courses_href_re = /www\.missouristate\.edu\/registrar\/catalog\/\w+\.htm/;

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (((tab != null ? tab.url : void 0) != null) && courses_href_re.test(tab.url)) {
    return chrome.tabs.executeScript({
      code: '// Link courses\nif (!window.mostateextensionapplied){\n  console.log("Apply mostate")\n    var em, el, emI, ems = document.getElementsByTagName("em");\n    document.head.appendChild(el = document.createElement("STYLE"), el.innerText="h3:target{background:yellowgreen}", el);\n    for (emI = 0; em=ems[emI], emI<ems.length; emI++){\n    if (em!=null) {\n    var temp = em.innerHTML; var re=/([A-Z]{3})\s*(\d{3})/g;\n    em.innerHTML = temp.replace(re, function(match,dep,num){\n    var temp = dep+num;\n    if (document.getElementById(temp)) { return temp.replace(re,"<a href=\'#$1$2\'>$1 $2</a>")}\n    else { return dep+" "+num }\n    })}}\n  window.mostateextensionapplied = true;\n}'
    });
  }
});
