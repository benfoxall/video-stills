const express = require('express')
const expressBrowserify = require('express-browserify')
const app = express()

// browserify main.js -o bundle.js
// app.get('/bundle.js', expressBrowserify('./main.js'));

app.use(express.static('.'))

app.get('/avc.wasm', (req, res) => {
  res.sendFile(__dirname + '/Broadway-gh-pages/avc.wasm', {
    headers: {
      'Content-Type': 'application/wasm'
    }
  })
})

app.listen(3000, () => console.log('http://localhost:3000'))