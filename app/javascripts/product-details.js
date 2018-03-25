function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

let _product = null

const Decision = {
  Undecided: '0', Accept: '1', Reject: '2'
}

const ProductStatus = {
  Sold: '0', Unsold: '1', Buying: '2'
}

export default {
  async start({account, EcommerceStore, Escrow, EscrowFactory}) {
    this.account = account
    this.EcommerceStore = EcommerceStore
    this.Escrow = Escrow
    this.EscrowFactory = EscrowFactory
    
    const ecommerceStore = await EcommerceStore.deployed()

    const productId = getParameterByName('id')
    const productFields = await ecommerceStore.getProduct(productId)

    _product = {
      store: productFields[0],
      id: productFields[1],
      name: productFields[2],
      category: productFields[3],
      desc: productFields[5],
      price: productFields[6],
      imageLink: productFields[4],
      status: productFields[7],
      escrow: productFields[8],
    }

    $('.product-details-right').hide()
    await this.renderProduct()
    $('.product-details-right').show()

    // page events
    $('#btnBuy').on('click', (event) => {
      this.buy(productId)
    })

    $('#btnAccept').on('click', (event) => {
      this.acceptEscrow()
    })

    $('#btnReject').on('click', (event) => {
      this.rejectEscrow()
    })

    // contract events
    ecommerceStore.ProductStatusChanged().watch((err, result) => {
      console.log('ProductStatusChanged', err, result)

      const productId = result.args.id
      if (productId.toString() !== _product.id.toString()) return
      
      _product.status = result.args.status
      _product.escrow = result.args.escrow

      this.renderProduct()
    })

    const escrowFactory = await EscrowFactory.deployed()
    console.log('escrowFactory address: ', escrowFactory.address)

    escrowFactory.EscrowCreated().watch(async (err, result) => {
      console.log('EscrowCreated', err, result)

      try {
        const productId = result.args.productId
        if (productId.toString() !== _product.id.toString()) return

        const escrowAddress = result.args.newAddress
        console.log({
          productId, escrowAddress
        })

        // only buyer who hit buy button would need to also make this call to update product status to buying
        if (this.isSeller()) return

        await ecommerceStore.buyProductWithEscrow(productId, escrowAddress)
      } catch (err) {
        console.error('EscrowCreated error: ', err)
      }
    })

    await this.watchEscrowEvents()
  },

  async watchEscrowEvents() {
    if (_product.status.toString() !== ProductStatus.Buying) {
      return
    }

    const productId = getParameterByName('id')
    const ecommerceStore = await this.EcommerceStore.deployed()

    const escrow = this.Escrow.at(_product.escrow)
    const balance = await web3.eth.getBalance(escrow.address, function(err, result) {
      console.log('escrow balance: ', err, result)
    })
    console.log('watching escrow: ', _product.escrow)

    escrow.BuyerDecided().watch((err, result) => {
      console.log('BuyerDecided', err, result)
      this.renderProduct()
    })
    escrow.SellerDecided().watch((err, result) => {
      console.log('BuyerDecided', err, result)
      this.renderProduct()
    })
    escrow.Concluded().watch(async (err, result) => {
      console.log('Concluded', err, result)

      try {
        if (result.args.decision.toString() === Decision.Accept) {
          if (this.isSeller()) {
            alert('Your product is sold! You should receive ETH soon!')
          } else {
            alert('Bought product! Seller should receive ETH soon!')
            await ecommerceStore.endProductBuying(productId, ProductStatus.Sold) // NOTE : any better way instead of doing this from the frontend?
          }
        }

        if (result.args.decision.toString() === Decision.Reject) {
          await ecommerceStore.endProductBuying(productId, ProductStatus.Unsold)
          alert('Escrow rejected! ETH will be refunded to buyer soon!')
          if (!this.isSeller()) {
            await ecommerceStore.endProductBuying(productId, ProductStatus.Unsold) // NOTE : any better way instead of doing this from the frontend?
          }
        }
        
      } catch (err) {
        console.error('Concluded error: ', err)
      }
    })
  },

  statusBadge (status) {
    switch (status.toString()) {
      case ProductStatus.Sold: return `<span class="badge badge-danger">Sold</span>`
      case ProductStatus.Unsold: return `<span class="badge badge-primary">Unsold</span>`
      case ProductStatus.Buying: return `<span class="badge badge-warning">Buying</span>`
      default: throw new Error('not recognized status: ' + status.toString())
    }
  },

  isSeller() {
    console.log('_product.store ', _product.store, 'account ', this.EcommerceStore.web3.eth.defaultAccount)
    return _product.store === this.EcommerceStore.web3.eth.defaultAccount
  },

  async renderProduct() {
    try {
      $('#name').val(_product.name)
      $('#category').val(_product.category)
      $('#desc').val(_product.desc)
      $('#price').val(web3.fromWei(_product.price, 'ether'))
      $('#image').attr('src', `http://localhost:8080/ipfs/${_product.imageLink}`)

      const $productInfo = $('#product-info')
      $productInfo.empty()

      $productInfo.html(this.statusBadge(_product.status))

      const isSeller = this.isSeller()
      const isBuying = _product.status.toString() === ProductStatus.Buying

      if (isSeller) {
        $productInfo.append('<span class="badge badge-info">You\'r seller</span>')
      }

      if (_product.status.toString() === ProductStatus.Sold) {
        $productInfo.append('<span class="badge badge-warning">Product Sold!</span>')
        $('#btnBuy').hide()
        $('#btnAccept').hide()
        $('#btnReject').hide()
        return
      }

      if (!isSeller && !isBuying) {
        $('#btnBuy').show()
      } else {
        $('#btnBuy').hide()
      }

      if (isBuying) {
        $('#btnAccept').show()
        $('#btnReject').show()
      } else {
        $('#btnAccept').hide()
        $('#btnReject').hide()
      }

      if (!isBuying) return
      const escrow = this.Escrow.at(_product.escrow)

      let isBuyer = false
      const buyer = await escrow.buyer()
      console.log('escrow buyer: ', buyer)
      if (buyer.toString() === this.account.toString()) {
        isBuyer = true
      }

      if (!isBuyer && !isSeller) {
        $('#btnBuy').hide()
        $('#btnAccept').hide()
        $('#btnReject').hide()
        return
      }

      const buyerDecision = await escrow.buyerDecision()
      const sellerDecision = await escrow.sellerDecision()
      if (buyerDecision.toString() === Decision.Accept) {
        $productInfo.append('<span class="badge badge-success">Buyer accepted escrow</span>')

        if (isBuyer) {
          $('#btnAccept').toggleClass('disabled', true)
        }
      }
      if (sellerDecision.toString() === Decision.Accept) {
        $productInfo.append('<span class="badge badge-success">Seller accepted escrow</span>')

        if (isSeller) {
          $('#btnAccept').toggleClass('disabled', true)
        }
      }
    } catch (err) {
      console.error('renderProduct error: ', err)
    }
  },

  async buy(productId) {
    try {
      console.log('buying productId: ', productId)

      const instance = await this.EscrowFactory.deployed()
      const result = await instance.createEscrow(_product.store, productId, {
        value: _product.price,
      })
      console.log('buy result: ', result)
    } catch (err) {
      console.error('buy error: ', err)
    }
  },

  async acceptEscrow() {
    try {
      const instance = await this.Escrow.at(_product.escrow)
      const result = await instance.accept({
        gas: 4712388,
        gasPrice: 100000000000,
      })
      console.log('acceptEscrow result: ', result)
    } catch (err) {
      console.error('acceptEscrow error: ', err)
    }
  },

  async rejectEscrow() {
    try {
      const instance = await this.Escrow.at(_product.escrow)
      const result = await instance.reject({
        gas: 4712388,
        gasPrice: 100000000000,
      })
      console.log('rejectEscrow result: ', result)
    } catch (err) {
      console.error('rejectEscrow error: ', err)
    }
  },
}
