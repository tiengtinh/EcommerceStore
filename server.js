const express = require('express')

const app = express()
const server = require('http').Server(app)

app.set('port', (process.env.PORT || 8082))

app.get('/', async function (req, res) {
    res.send('Home')
})

app.get('/api', async function (req, res) {
    res.send('API')
})

app.get('/home2', async function (req, res) {
    res.send('Home2')
})

server.listen(app.get('port'), function () {
    console.log('Server is running on port', app.get('port'));
})
