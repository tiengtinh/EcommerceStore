var EscrowFactory = artifacts.require("./EscrowFactory.sol");

contract('Escrow', function(accounts) {
  it("should refund to buyer if seller reject", function(done) {

    EscrowFactory.deployed().then((escrowFactory) => {
      function escrowCreated(err, result) {
        assert.equal(err, null)
        done()
      }

      escrowFactory.createEscrow(accounts[1], accounts[2], '1', {
        from: accounts[3],
        value: 1,
        gas: 4712388,
        gasPrice: 100000000000,
      }).then(escrowCreated)
    })
  });
});
