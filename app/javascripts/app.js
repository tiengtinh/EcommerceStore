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

    this.listenContractEvents().catch(err => console.error('listenContractEvents error: ', err))

    if (_$products.length !== 0) {
      this.getProducts().catch(err => console.error('getProducts error: ', err))
    }
  },

  async getProducts() {
    const response = await fetch('/api/products')
    const resp = await response.json()
    _products = resp.data

    this.renderProducts()
  },

  renderStatusBadge(status) {
    switch (status.toString()) {
      case '0': return `<span class="badge badge-danger">Sold</span>`
      case '1': return `<span class="badge badge-primary">Unsold</span>`
      case '2': return `<span class="badge badge-warning">Buying</span>`
      default: throw 'not recognized status: ' + status.toString()
    }
  },

  renderProducts() {
    _$products.empty()
    for (const product of _products) {
      _$products.append(`
        <div class="col-lg-4 col-md-6 mb-4">
          <div class="card h-100">
            <a href="#"><img class="card-img-top" src="http://localhost:8080/ipfs/${product.imageLink}" alt=""></a>
            <div class="card-body">
              <h4 class="card-title">
                <a href="#">${product.name}</a>
              </h4>
              <h5>${web3.fromWei(product.price, 'ether')} ETH</h5>
              <p class="card-text">${product.desc}</p>
            </div>
            <div class="card-footer">
              <span class="badge badge-secondary">${product.category}</span>
              ${this.renderStatusBadge(product.status)}
            </div>
          </div>
        </div>`
      )
    }
  },

  async listenContractEvents () {
    console.log('getting EcommerceStore instance')

    const instance = await EcommerceStore.deployed()

    console.log('listen to contract events')

    const productCreatedEvent = instance.ProductCreated()
    productCreatedEvent.watch((err, result) => {
      console.log('productCreatedEvent', err, result)
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
  },

  refreshBalance: function() {
    var self = this;

    var meta;
    MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.getBalance.call(account, {from: account});
    }).then(function(value) {
      var balance_element = document.getElementById("balance");
      balance_element.innerHTML = value.valueOf();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getting balance; see log.");
    });
  },

  sendCoin: function() {
    var self = this;

    var amount = parseInt(document.getElementById("amount").value);
    var receiver = document.getElementById("receiver").value;

    this.setStatus("Initiating transaction... (please wait)");

    var meta;
    MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.sendCoin(receiver, amount, {from: account});
    }).then(function() {
      self.setStatus("Transaction complete!");
      self.refreshBalance();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending coin; see log.");
    });
  }
};

window.addEventListener('load', async function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
  }

  await App.start()
});
