pragma solidity ^0.4.17;

contract EcommerceStore {
    enum ProductStatus {Sold, Unsold, Buying}

    event ProductCreated(
        address store,
        uint id, string name, string category, string imageLink, string desc, uint price, ProductStatus status
    );

    event ProductStatusChanged(
        uint id, ProductStatus status, address escrow
    );

    uint public productIndex;

    mapping (address => mapping (uint => Product)) stores;
    mapping (uint => address) productIdInStore;

    struct Product {
        uint id;
        string name;
        string category;
        string imageLink;
        string desc;
        uint price; // in ETH

        ProductStatus status;
        address escrow;
    }

    function EcommerceStore() public {
        productIndex = 0;
    }

    function addProduct(string _name, string _category, string _imageLink, string _desc, uint _price) public {
        productIndex++;
        Product memory product = Product(productIndex, _name, _category, _imageLink, _desc, _price, ProductStatus.Unsold, 0);
        stores[msg.sender][productIndex] = product;
        productIdInStore[productIndex] = msg.sender;
        ProductCreated(msg.sender, productIndex, _name, _category, _imageLink, _desc, _price, ProductStatus.Unsold);
    }

    function buyProductWithEscrow(uint _id, address _escrow) public {
        address store = productIdInStore[_id];
        stores[store][_id].status = ProductStatus.Buying;
        stores[store][_id].escrow = _escrow;
        ProductStatusChanged(_id, ProductStatus.Buying, _escrow);
    }

    function finalizeProductBuying(uint _id, ProductStatus _status) public {
        require(_status == ProductStatus.Sold || _status == ProductStatus.Unsold);
        address store = productIdInStore[_id];
        stores[store][_id].status = _status;
        ProductStatusChanged(_id, _status, 0);
    }

    function getProduct(uint _productId) view public returns (
        address _store,
        uint _id, string _name, string _category, string _imageLink, string _desc, uint _price, ProductStatus _status, address _escrow
    ) {
        address store = productIdInStore[_productId];
        Product memory product = stores[store][_productId];
        return (store, product.id, product.name, product.category, product.imageLink, product.desc, product.price, product.status, product.escrow);
    }
}
