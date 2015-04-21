# var re = /\b(\w{3}) ?(\d{2,3})\b/, h = $("li").filter(function(){return re.test(this.innerText)})


chrome.browserAction.onClicked.addListener (tab) ->
  # No tabs or host permissions needed!
  chrome.tabs.executeScript({
    code: 'document.body.style.backgroundColor="red"'
  })

courses_href_re = /www\.missouristate\.edu\/registrar\/catalog\/\w+\.htm/
if courses_href_re.test window.location.href
  console.log "viewing"