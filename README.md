
# CoderSchool Week 02 Assigment: Ecommerce Store

Some note on UI interactions:

- Buy button is visible only if you're not the one who posted the product (meaning you're seller).

- After buyer hit buy button. Both parties (buyer, seller) will be able to see Accept/Reject escrow buttons.

## Prerequisites

- MongoDB running locally on port 27017
- ipfs daemon running on local with CORS enabled for image upload:
```
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["GET", "POST"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers '["Authorization"]'
ipfs config --json API.HTTPHeaders.Access-Control-Expose-Headers '["Location"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Credentials '["true"]'
```

## Development

`truffle develop`

Deploy contract:
```
truffle console
  migrate --reset
```

`npm run dev` to start server + frontend concurrently

## Some misc scripts:

```
EcommerceStore.deployed().then((i) => i.getProduct(1) );

EcommerceStore.deployed().then((i) => i.addProduct('TV', 'electronic', 'bla', 'awesome product', 100) );

escrowFactoryAddress = EscrowFactory.deployed().then((i) => i.address );

EscrowFactory.deployed().then((i) => web3.eth.getBalance(i.address, function(err, result) { console.log('balance: ', result.toString()) }) );

```
