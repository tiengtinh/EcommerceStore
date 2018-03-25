pragma solidity ^0.4.17;

contract EscrowFactory {
    event EscrowCreated(address newAddress, uint productId);

    function EscrowFactory() public {

    }

    function createEscrow(address seller, uint productId) public payable {
        address a = address((new Escrow).value(msg.value)(address(this), msg.sender, seller));
        EscrowCreated(a, productId);
    }
}

contract Escrow {
    enum Decision{ Undecided, Accept, Reject }

    uint public createdAt;
    address public buyer;
    address public seller;

    address public feeTaker;

    Decision public buyerDecision;
    Decision public sellerDecision;

    event BuyerDecided(Decision decision);
    event SellerDecided(Decision decision);
    event Concluded(Decision decision);

    function Escrow(address _feeTaker, address _buyer, address _seller) public payable {
        createdAt = now;

        feeTaker = _feeTaker;
        buyer = _buyer;
        seller = _seller;
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
            uint fee = amount / 100; // 1% fee
            uint sellerGetAmount = amount - fee;
            seller.transfer(sellerGetAmount);
            feeTaker.transfer(fee);
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

        buyer.transfer(address(this).balance);
        Concluded(Decision.Reject);
    }
}
