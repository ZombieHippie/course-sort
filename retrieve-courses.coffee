async = require 'async'
cheerio = require 'cheerio' 
request = require 'request'
fs = require 'fs'

# data = require './data.json'
# updateData = (key, value) ->
#   data[key] = value
#   fs.writeFileSync "./data.json", JSON.stringify data, null, 2
#   console.log "Updated data[#{key}]"

domain = "http://www.missouristate.edu"

parseListItem = ($, li) ->
  li = $ li
  {
    course_id: li.text().match(/[A-Z]{3} \d{3}/)[0]
  }

# Use the catalog page of a department to research associated courses 
retrieveCatalogCourses = (catalogURL, callback) ->
  catalog = {}
  request domain + catalogURL, (error, response, body) ->
    if error
      callback error

    else
      $courses = cheerio.load body
      $courses(".CatalogCourses ul li").each ->
        info = parseListItem $courses, @
        catalog[info.course_id] = info
      callback null, catalog

retrieveCatalogCourses "/registrar/catalog/courses_cs.htm", (error, catalog) ->
  fs.writeFileSync "./courses_cs.json", JSON.stringify catalog, null, 2
