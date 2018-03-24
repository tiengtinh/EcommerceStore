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

    function Escrow(address _seller) public payable {
        createdAt = now;

        buyer = msg.sender;
        seller = _seller;
    }

    function accept() public {
        require(msg.sender == buyer || msg.sender == seller);
        if (msg.sender == buyer) {
            buyerDecision = Decision.Accept;
        }

        if (msg.sender == seller) {
            sellerDecision = Decision.Accept;
        }
    }

    function reject() public {
        require(msg.sender == buyer || msg.sender == seller);

        if (msg.sender == buyer) {
            buyerDecision = Decision.Reject;
        }

        if (msg.sender == seller) {
            sellerDecision = Decision.Reject;
        }
    }
}
