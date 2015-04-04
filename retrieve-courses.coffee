async = require 'async'
cheerio = require 'cheerio' 
request = require 'request'
fs = require 'fs'

domain = "http://www.missouristate.edu"

course_id_re = /(\W)([A-Z]{3}) ?(\d{3})(\D)/g
course_id_pl = "$1<span data-link='$2$3'>$2 $3</span>$4"
linkCoursesInHTML = (html) ->
  html.replace course_id_re, course_id_pl

# Take cheerio (jQuery) context, and listItem course element, and parse into an object
parseListItem = ($, li) ->
  li = $ li
  h3 = li.find("h3")
  info = {
    course_id: h3.attr("id")
    title: h3.text()
  }
  p = li.children("p")
  # Description and prereq info
  if p.length is 2
    # Prereq / extra info box present
    info.req = linkCoursesInHTML p.eq(0).html()
    info.desc = linkCoursesInHTML p.eq(1).html()

  else
    # Just description
    info.desc = linkCoursesInHTML p.eq(0).html()

  info.hours = {}
  li.find('dt').each ->
    dt = $ @
    dtText = dt.text()
    ddInt = parseInt dt.next().text()
    if ddInt
      switch dtText
        when "Lecture contact hours:"
          info.hours.lecture = ddInt
        when "Lab contact hours:"
          info.hours.lab = ddInt
        when "Credit hours:"
          info.hours.credit = ddInt

  info.offered = {}
  typicallyOffered = li.find(".HoursOffering>p").eq(0).text()
  offered_re = /Fall|Spring|Upon demand|Summer/g
  while match = offered_re.exec(typicallyOffered)
    info.offered[match[0]] = true

  return info

# Use the catalog page of a department to research associated courses 
retrieveCatalogCourses = (catalogURL, callback) ->
  catalog = {}
  request domain + catalogURL, (error, response, body) ->
    if error
      callback error

    else
      $courses = cheerio.load body
      $courses(".CatalogCourses ul li").slice(3,10).each ->
        info = parseListItem $courses, @
        catalog[info.course_id] = info
      callback null, catalog

abbr_list = {}
catalog_page_re = /catalog\/(\w+)\.htm/
for abbr, value of require('./data.json').catalog_urls
  match = value.href.match catalog_page_re
  abbr_list[match[1]] = true

console.log abbr_list

all_catalog = {}
async.eachSeries( Object.keys(abbr_list)
  , (abbr, done) ->
    retrieveCatalogCourses "/registrar/catalog/#{abbr}.htm", (error, catalog) ->
      if error then done error
      else
        fs.writeFileSync "./#{abbr}.json", JSON.stringify catalog, null, 2
        all_catalog[abbr] = catalog
        done()
  , (error) ->
    if error then console.error "error!", error
    else
      fs.writeFileSync "./all_catalog.json", JSON.stringify(all_catalog)
  )