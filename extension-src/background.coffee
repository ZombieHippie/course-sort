# var re = /\b(\w{3}) ?(\d{2,3})\b/, h = $("li").filter(function(){return re.test(this.innerText)})


courses_href_re = /www\.missouristate\.edu\/registrar\/catalog\/\w+\.htm/
chrome.tabs.onUpdated.addListener (tabId, changeInfo, tab)->
  if tab?.url? and courses_href_re.test tab.url
      chrome.tabs.executeScript({
        code: '''// Link courses
                if (!window.mostateextensionapplied){
                  console.log("Apply mostate")
                    var em, el, emI, ems = document.getElementsByTagName("em");
                    document.head.appendChild(el = document.createElement("STYLE"), el.innerText="h3:target{background:yellowgreen}", el);
                    for (emI = 0; em=ems[emI], emI<ems.length; emI++){
                    if (em!=null) {
                    var temp = em.innerHTML; var re=/([A-Z]{3})\s*(\d{3})/g;
                    em.innerHTML = temp.replace(re, function(match,dep,num){
                    var temp = dep+num;
                    if (document.getElementById(temp)) { return temp.replace(re,"<a href='#$1$2'>$1 $2</a>")}
                    else { return dep+" "+num }
                    })}}
                  window.mostateextensionapplied = true;
                }'''
      })