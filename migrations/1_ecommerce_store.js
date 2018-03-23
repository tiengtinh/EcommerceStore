const connectMgo = require('../connectMgo')

var EcommerceStore = artifacts.require("./EcommerceStore.sol");

module.exports = async function (deployer) {
  deployer.deploy(EcommerceStore);

  const db = await connectMgo()
  console.log('empty products collection')
  await db.collection('products').deleteMany()
};

// module.exports = function(deployer) {
//   deployer.deploy(ConvertLib);
//   deployer.link(ConvertLib, MetaCoin);
//   deployer.deploy(MetaCoin);
// };
