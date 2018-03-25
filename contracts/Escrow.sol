pragma solidity ^0.4.17;

contract EscrowFactory {
    event EscrowCreated(address newAddress, uint productId);

    function EscrowFactory() public {

    }

    function createEscrow(address seller, uint productId) public payable {
        address a = address((new Escrow).value(msg.value)(seller));
        EscrowCreated(a, productId);
    }
}

contract Escrow {
    enum Decision{ Undecided, Accept, Reject }

    uint public createdAt;
    address public buyer;
    address public seller;

    Decision public buyerDecision;
    Decision public sellerDecision;

    event BuyerDecided(Decision decision);
    event SellerDecided(Decision decision);
    event Concluded(Decision decision);

    function Escrow(address _seller) public payable {
        createdAt = now;

        buyer = msg.sender;
        seller = _seller;
    }

    function accept() public {
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
            seller.transfer(address(this).balance);
            Concluded(Decision.Accept);
        }
    }

    function reject() public {
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
