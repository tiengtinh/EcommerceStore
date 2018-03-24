```
EcommerceStore.deployed().then((i) => i.getProduct(1) );

EcommerceStore.deployed().then((i) => i.addProduct('TV', 'electronic', 'bla', 'awesome product', 100) );
```

```
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["GET", "POST"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers '["Authorization"]'
ipfs config --json API.HTTPHeaders.Access-Control-Expose-Headers '["Location"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Credentials '["true"]'
```

```
truffle develop --log

truffle console
  migrate --reset
```

`npm run dev` to start server + frontend concurrently

Buy button is visible only if you're not the one who posted the product (meaning you're seller)

After clicking the buy button, you will be requested to confirm transaction by MetaMask twice. Once for Escrow creation. Another for product status update.