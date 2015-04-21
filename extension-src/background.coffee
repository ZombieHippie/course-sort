# var re = /\b(\w{3}) ?(\d{2,3})\b/, h = $("li").filter(function(){return re.test(this.innerText)})


chrome.browserAction.onClicked.addListener (tab) ->
  # No tabs or host permissions needed!
  console.log('Turning ' + tab.url + ' red!')
  chrome.tabs.executeScript({
    code: 'document.body.style.backgroundColor="red"'
  })