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

    this.renderProduct()

    // page events
    $('#btnBuy').on('click', (event) => {
      this.buy(productId)
    })

    // contract events
    ecommerceStore.ProductStatusChanged().watch((err, result) => {
      console.log('ProductStatusChanged', err, result)

      const productId = result.args.id
      if (productId !== _product.id) return
      
      _product.status = result.args.status
      _product.escrow = result.args.escrow

      this.renderProduct()
    })

    const escrowFactory = await EscrowFactory.deployed()

    escrowFactory.EscrowCreated().watch(async (err, result) => {
      console.log('EscrowCreated', err, result)

      try {
        const productId = result.args.productId
        if (productId !== _product.id) return

        const escrowAddress = result.args.newAddress
        console.log({
          productId, escrowAddress
        })

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

    console.log('watching escrow: ', _product.escrow)
    const escrow = Escrow.at(_product.escrow)
    escrow.BuyerDecided().watch(this.renderProduct.bind(this))
    escrow.SellerDecided().watch(this.renderProduct.bind(this))
    escrow.Concluded().watch(async (err, result) => {
      console.log('Concluded', err, result)

      try {
        if (result.args.decision.toString() === Decision.Accept) {
          await ecommerceStore.endProductBuying(productId, ProductStatus.Sold) // NOTE : any better way instead of doing this from the frontend?
          if (this.isSeller()) {
            alert('Your product is sold! You should receive ETH soon!')
          } else {
            alert('Bought product! Seller should receive ETH soon!')
          }
        }

        if (result.args.decision.toString() === Decision.Reject) {
          await ecommerceStore.endProductBuying(productId, ProductStatus.Unsold)
          alert('Escrow rejected! ETH will be refunded to buyer soon!')
        }
        
      } catch (err) {
        console.error('EscrowCreated error: ', err)
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
    return _product.store === this.EcommerceStore.web3.eth.defaultAccount
  },

  async renderProduct() {
    try {
      $('#name').val(_product.name)
      $('#category').val(_product.category)
      $('#desc').val(_product.desc)
      $('#price').val(_product.price)
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

      const buyerDecision = await escrow.buyerDecision()
      const sellerDecision = await escrow.sellerDecision()
      if (buyerDecision.toString() === Decision.Accept) {
        $productInfo.append('<span class="badge badge-success">Buyer accepted escrow</span>')
      }
      if (sellerDecision.toString() === Decision.Accept) {
        $productInfo.append('<span class="badge badge-success">Seller accepted escrow</span>')
      }
    } catch (err) {
      console.error('renderProduct error: ', err)
    }
  },

  async buy(productId) {
    try {
      console.log('buying productId: ', productId)

      const product = _products.find((p) => p.id.toString() === productId.toString())

      const instance = await this.EscrowFactory.deployed()
      const result = await instance.createEscrow(product.store, productId, {
        value: product.price,
      })
      console.log('buy result: ', result)
    } catch (err) {
      console.error('buy error: ', err)
    }
  },
}
