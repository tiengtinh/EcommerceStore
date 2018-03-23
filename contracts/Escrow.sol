pragma solidity ^0.4.17;

contract EscrowFactory {
    event EscrowCreated(address newAddress);

    function EscrowFactory() public {

    }

    function createEscrow(address seller) public payable {
        address a = address((new Escrow).value(msg.value)(seller));
        EscrowCreated(a);
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
        if (msg.sender == buyer) {
            buyerDecision = Decision.Accept;
        }

        if (msg.sender == seller) {
            sellerDecision = Decision.Accept;
        }
    }

    function reject() public {
        if (msg.sender == buyer) {
            buyerDecision = Decision.Reject;
        }

        if (msg.sender == seller) {
            sellerDecision = Decision.Reject;
        }
    }
}
