pragma solidity ^0.4.17;

contract EcommerceStore {
    enum ProductStatus {Sold, Unsold, Buying}

    uint public productIndex;

    mapping (address => mapping (uint => Product)) stores;
    mapping (uint => address) productIdInStore;

    struct Product {
        uint id;
        string name;
        string category;
        string imageLink;
        string desc;
        uint price;
        ProductStatus status;
    }

    function EcommerceStore() public {
        productIndex = 0;
    }

    function addProduct(string _name, string _category, string _imageLink, string _desc, uint _price) public {
        productIndex++;
        Product memory product = Product(productIndex, _name, _category, _imageLink, _desc, _price, ProductStatus.Unsold);
        stores[msg.sender][productIndex] = product;
        productIdInStore[productIndex] = msg.sender;
    }

    function getProduct(uint _productId) view public returns (
        uint _id, string _name, string _category, string _imageLink, string _desc, uint, ProductStatus
    ) {
        Product memory product = stores[msg.sender][_productId];
        return (product.id, product.name, product.category, product.imageLink, product.desc, product.price, product.status);
    }
}
