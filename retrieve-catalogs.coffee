async = require 'async'
cheerio = require 'cheerio' 
request = require 'request'
fs = require 'fs'

data = require './data.json'
updateData = (key, value) ->
  data[key] = value
  fs.writeFileSync "./data.json", JSON.stringify data, null, 2
  console.log "Updated data[#{key}]"

domain = "http://www.missouristate.edu"
# Use the index page of all the department course catalogs
# to obtain links to each course offering webpage.
retrieveCatalogURLs = (callback) ->
  catalog_urls = {}
  catalogDeptIndexURL = "/registrar/catalog/coursesearch.htm"
  request domain + catalogDeptIndexURL, (error, response, body) ->
    if error
      callback error

    else
      $index = cheerio.load body
      $index(".ProgramsOffered ul li").each ->
        li = $index @
        [abbr, name] = li.text().split /\s+\-\s+/
        catalog_urls[abbr] = {
          name,
          href: li.find("a").attr("href").replace(domain, "")
        }
      callback null, catalog_urls

if not data.catalog_urls
  retrieveCatalogURLs (error, catalog_urls) ->
    if error
      console.error "Error on retrieveCatalogURLs:"
      console.error error

    else
      updateData "catalog_urls", catalog_urls
