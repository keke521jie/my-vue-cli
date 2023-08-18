const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url')

const httpServer = http.createServer( function (req, res) {
  fs.createReadStream(path.resolve(__dirname, './dist/'+req.url)).pipe(res)
})
httpServer.listen(8080, function() { 
  console.log('App running at: http://localhost:8080/index.html') 
})