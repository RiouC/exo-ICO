require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-solhint');

task('accounts', async function () {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: '0.8.4',
};
