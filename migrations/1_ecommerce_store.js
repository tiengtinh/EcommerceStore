var EcommerceStore = artifacts.require("./EcommerceStore.sol");

module.exports = function (deployer) {
  deployer.deploy(EcommerceStore);
};

// module.exports = function(deployer) {
//   deployer.deploy(ConvertLib);
//   deployer.link(ConvertLib, MetaCoin);
//   deployer.deploy(MetaCoin);
// };
