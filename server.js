const fs = require('fs')
const express = require('express')
const Web3 = require('web3')
const contract = require('truffle-contract')

const connectMgo = require('./connectMgo')

const provider = new Web3.providers.HttpProvider("http://127.0.0.1:9545")
const web3 = new Web3(provider)

// const ecommerce_store_artifacts = require('./build/contracts/EcommerceStore.json')
const EcommerceStore = contract(JSON.parse(fs.readFileSync('./build/contracts/EcommerceStore.json', 'utf8')))
EcommerceStore.setProvider(provider)

async function listenContractEvents() {
    const instance = await EcommerceStore.deployed()

    instance.ProductCreated().watch(async (err, result) => {
      if (err) {
        return console.error('productCreatedEvent err: ', err)
      }

      console.log('productCreatedEvent result: ', JSON.stringify(result.args))

      try {
        const db = await connectMgo()
        await db.collection('products').updateOne(
          { _id: result.args.id.toString() },
          {
            $set: {
              store: result.args.store.toString(), 
              name: result.args.name.toString(),
              category: result.args.category.toString(),
              imageLink: result.args.imageLink.toString(),
              desc: result.args.desc.toString(),
              price: result.args.price.toString(),
              status: result.args.status.toString()
            }
          },
          { upsert: true },
        )
      } catch (err) {
        console.error('productCreatedEvent error: ', err)
      }
    })
}

const app = express()
const server = require('http').Server(app)

app.set('port', (process.env.PORT || 8082))

app.get('/products', async function (req, res) {
  try {
    const db = await connectMgo()

    const products = await db.collection('products').find().toArray()

    res.send({
      data: products
    })
  } catch (err) {
    res.status(500).send({
      error: err.message
    })
  }
})

listenContractEvents()

server.listen(app.get('port'), function () {
  console.log('Server is running on port', app.get('port'))
})
