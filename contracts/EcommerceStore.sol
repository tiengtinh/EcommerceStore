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
        stores[msg.sender][_id].status = ProductStatus.Buying;
        stores[msg.sender][_id].escrow = _escrow;
        ProductStatusChanged(_id, ProductStatus.Buying, _escrow);
    }

    function getProduct(uint _productId) view public returns (
        uint _id, string _name, string _category, string _imageLink, string _desc, uint _price, ProductStatus _status, address _escrow
    ) {
        Product memory product = stores[msg.sender][_productId];
        return (product.id, product.name, product.category, product.imageLink, product.desc, product.price, product.status, product.escrow);
    }
}
