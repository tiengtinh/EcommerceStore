// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/shop-homepage.css";
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'
import ipfsAPI from 'ipfs-api'

const ipfs = ipfsAPI('localhost', '5001')

// Import our contract artifacts and turn them into usable abstractions.
import ecommerce_store_artifacts from '../../build/contracts/EcommerceStore.json'

// MetaCoin is our usable abstraction, which we'll use through the code below.
var EcommerceStore = contract(ecommerce_store_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;

let _products = []
let _$products

window.App = {
  start: async function() {
    try {
      var self = this;

      // Bootstrap the MetaCoin abstraction for Use.
      EcommerceStore.setProvider(web3.currentProvider);
      EcommerceStore.web3.eth.defaultAccount = web3.eth.accounts[0]

      console.log('Get the initial account balance')
      // Get the initial account balance so it can be displayed.
      web3.eth.getAccounts(function (err, accs) {
        if (err != null) {
          alert("There was an error fetching your accounts.")
          return
        }

        if (accs.length == 0) {
          alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
          return
        }

        accounts = accs
        account = accounts[0]
      })

      console.log('binding page events')

      let reader
      $('#image').on('change', function (event) {
        const file = event.target.files[0]
        reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
      })

      $('#product-create-form').submit((event) => {
        event.preventDefault()

        this.createProduct(reader).catch(err => console.log('createProduct error: ', err))
      })

      _$products = $('.products')

      if (_$products.length !== 0) {
        await this.getProducts()
      }

      await this.listenContractEvents()
    } catch (err) {
      console.error('app error: ', err)
    }
  },

  async getProducts () {
    const response = await fetch('/api/products')
    const resp = await response.json()
    _products = resp.data.map((p) => {
      p.id = p._id
      delete p._id
      return p
    })

    this.renderProducts()
  },

  renderStatusBadge (status) {
    switch (status.toString()) {
      case '0': return `<span class="badge badge-danger">Sold</span>`
      case '1': return `<span class="badge badge-primary">Unsold</span>`
      case '2': return `<span class="badge badge-warning">Buying</span>`
      default: throw new Error('not recognized status: ' + status.toString())
    }
  },

  renderProduct (product) {
    const isSeller = product.store === account
    return `
      <div class="col-lg-4 col-md-6 mb-4">
        <div class="card h-100 product">
          <a href="#"><img class="card-img-top" src="http://localhost:8080/ipfs/${product.imageLink}" alt=""></a>
          <div class="card-body">
            <h4 class="card-title">
              ${product.name}
            </h4>
            <h5>${web3.fromWei(product.price, 'ether')} ETH</h5>
            ${
              !isSeller ? `<button type="button" class="btn btn-primary btn-buy">
                Buy <span class="badge badge-light">1</span>
              </button>` : ''
            }
            <p class="card-text">${product.desc}</p>
          </div>
          <div class="card-footer">
            <span class="badge badge-secondary">${product.category}</span>
            ${this.renderStatusBadge(product.status)}
            ${isSeller ? '<span class="badge badge-info">You\'r seller</span>' : ''}
          </div>
        </div>
      </div>`
  },

  renderProducts () {
    _$products.empty()
    for (const product of _products) {
      _$products.append(this.renderProduct(product))
    }
  },

  async listenContractEvents () {
    console.log('getting EcommerceStore instance')

    const instance = await EcommerceStore.deployed()

    console.log('listen to contract events')

    const productCreatedEvent = instance.ProductCreated()
    productCreatedEvent.watch((err, result) => {
      console.log('productCreatedEvent', err, result)

      const product = result.args

      const foundIndex = _products.findIndex((p) => p.id.toString() === result.args.id.toString())
      if (foundIndex === -1) {
        _products.push(product)
      } else {
        _products[foundIndex] = product
      }

      this.renderProducts()
    })
  },

  async createProduct (reader) {
    const instance = await EcommerceStore.deployed()

    let imageId = ''
    if (reader) {
      const resp = await this.saveImageOnIpfs(reader)
      imageId = resp[0].hash
    }

    const name = $('#name').val()
    const category = $('#category').val()
    const desc = $('#desc').val()
    const price = parseInt($('#price').val())

    console.log({
      name, category, imageId, desc, price
    })
    const result = await instance.addProduct(
      name, category, imageId, desc, web3.toWei(price, 'ether'),
    )
    console.log('createProduct result: ', result)
  },

  saveImageOnIpfs (reader) {
    const buffer = Buffer.from(reader.result)
    return ipfs.add(buffer)
  }
}

window.addEventListener('load', async function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn('Using web3 detected from external source.' +
      ' If you find that your accounts don\'t appear or you have 0 MetaCoin, ensure you\'ve configured that source properly.' +
      ' If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask')
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider)
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask")
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"))
  }

  await App.start()
})
