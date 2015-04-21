var courses_href_re;

chrome.browserAction.onClicked.addListener(function(tab) {
  return chrome.tabs.executeScript({
    code: 'document.body.style.backgroundColor="red"'
  });
});

courses_href_re = /www\.missouristate\.edu\/registrar\/catalog\/\w+\.htm/;

if (courses_href_re.test(window.location.href)) {
  console.log("viewing");
}
