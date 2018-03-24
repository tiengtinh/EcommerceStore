const fs = require('fs')
const express = require('express')
const Web3 = require('web3')
const contract = require('truffle-contract')

const connectMgo = require('./connectMgo')

const provider = new Web3.providers.HttpProvider("http://127.0.0.1:9545")
const web3 = new Web3(provider)

const EcommerceStore = contract(JSON.parse(fs.readFileSync('./build/contracts/EcommerceStore.json', 'utf8')))
EcommerceStore.setProvider(provider)
// const EscrowFactory = contract(JSON.parse(fs.readFileSync('./build/contracts/EscrowFactory.json', 'utf8')))
// EscrowFactory.setProvider(provider)

async function listenContractEvents() {
    const ecommerceStore = await EcommerceStore.deployed()

    ecommerceStore.ProductCreated().watch(async (err, result) => {
      if (err) {
        return console.error('ProductCreated err: ', err)
      }

      console.log('ProductCreated result: ', JSON.stringify(result.args))

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
              status: result.args.status.toString(),
              escrow: '0x0000000000000000000000000000000000000000',
            }
          },
          { upsert: true },
        )
      } catch (err) {
        console.error('ProductCreated error: ', err)
      }
    })

    ecommerceStore.ProductStatusChanged().watch(async (err, result) => {
      if (err) {
        return console.error('ProductStatusChanged err: ', err)
      }

      console.log('ProductStatusChanged result: ', JSON.stringify(result.args))

      try {
        const db = await connectMgo()
        await db.collection('products').updateOne(
          { _id: result.args.id.toString() },
          {
            $set: {
              status: result.args.status.toString(),
              escrow: result.args.escrow.toString(),
            }
          },
          { upsert: true },
        )
      } catch (err) {
        console.error('ProductStatusChanged err: ', err)
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
