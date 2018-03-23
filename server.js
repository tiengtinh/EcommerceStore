const fs = require('fs')
const express = require('express')
const Web3 = require('web3')
const contract = require('truffle-contract')

const provider = new Web3.providers.HttpProvider("http://127.0.0.1:9545")
const web3 = new Web3(provider)

// const ecommerce_store_artifacts = require('./build/contracts/EcommerceStore.json')
const EcommerceStore = contract(JSON.parse(fs.readFileSync('./build/contracts/EcommerceStore.json', 'utf8')))
EcommerceStore.setProvider(provider)

async function listenContractEvents() {
    const instance = await EcommerceStore.deployed()

    const product = await instance.getProduct(1)
    console.log('product', product)

    const productCreatedEvent = instance.ProductCreated()
    productCreatedEvent.watch(async (err, result) => {
        if (err) {
            return console.error('productCreatedEvent err: ', err)
        }

        console.log('productCreatedEvent result: ', JSON.stringify(result.args))
    })
}

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

listenContractEvents()

server.listen(app.get('port'), function () {
    console.log('Server is running on port', app.get('port'));
})
