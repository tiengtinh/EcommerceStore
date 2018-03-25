pragma solidity ^0.4.17;

import "./EcommerceStore.sol";

contract EscrowFactory {
    event EscrowCreated(address newAddress, uint productId);

    function EscrowFactory() public {
    }

    function createEscrow(address ecommerceStore, address seller, uint productId) public payable {
        address a = address((new Escrow).value(msg.value)(ecommerceStore, msg.sender, seller, productId));

        EcommerceStore(ecommerceStore).buyProductWithEscrow(productId, a);

        EscrowCreated(a, productId);
    }
}

contract Escrow {
    enum Decision{ Undecided, Accept, Reject }

    uint public createdAt;
    address public buyer;
    address public seller;
    address public ecommerceStore;

    uint public productId;

    Decision public buyerDecision;
    Decision public sellerDecision;

    event BuyerDecided(Decision decision);
    event SellerDecided(Decision decision);
    event Concluded(Decision decision);

    function Escrow(address _ecommerceStore, address _buyer, address _seller, uint _productId) public payable {
        require(_buyer != _seller);
        createdAt = now;

        ecommerceStore = _ecommerceStore;
        buyer = _buyer;
        seller = _seller;
        productId = _productId;
    }

    function accept() public payable {
        require(msg.sender == buyer || msg.sender == seller);
        if (msg.sender == buyer) {
            buyerDecision = Decision.Accept;
            BuyerDecided(Decision.Accept);
        }

        if (msg.sender == seller) {
            sellerDecision = Decision.Accept;
            SellerDecided(Decision.Accept);
        }

        if (buyerDecision == Decision.Accept && sellerDecision == Decision.Accept) {
            uint amount = address(this).balance;
            uint fee = amount / 100; // 1% fee stay in escrow
            uint sellerGetAmount = amount - fee;
            
            seller.transfer(sellerGetAmount);

            EcommerceStore(ecommerceStore).finalizeProductBuying(productId, EcommerceStore.ProductStatus.Sold);
            Concluded(Decision.Accept);
        }
    }

    function reject() public payable {
        require(msg.sender == buyer || msg.sender == seller);

        if (msg.sender == buyer) {
            buyerDecision = Decision.Reject;
            BuyerDecided(Decision.Reject);
        }

        if (msg.sender == seller) {
            sellerDecision = Decision.Reject;
            SellerDecided(Decision.Reject);
        }

        uint amount = address(this).balance;
        uint fee = amount / 100; // 1% fee stay in escrow
        uint buyerRefundAmount = amount - fee;

        buyer.transfer(buyerRefundAmount);

        EcommerceStore(ecommerceStore).finalizeProductBuying(productId, EcommerceStore.ProductStatus.Unsold);
        Concluded(Decision.Reject);
    }
}
