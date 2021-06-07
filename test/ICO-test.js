const { expect } = require('chai');

describe('ICO', async function () {
  this.slow(2000);
  let dev, owner, alice, bob, charlie, ICO, ico, ArchiMat, archimat;
  const NAME = 'ICO';
  const INIT_SUPPLY = ethers.utils.parseEther('1');

  beforeEach(async function () {
    [dev, owner, alice, bob, charlie] = await ethers.getSigners();

    ArchiMat = await ethers.getContractFactory('ArchiMat');
    archimat = await ArchiMat.connect(dev).deploy(owner.address, INIT_SUPPLY);
    await archimat.deployed();

    ICO = await ethers.getContractFactory('ICO');
    ico = await ICO.connect(dev).deploy(owner.address, archimat.address);
    await ico.deployed();
  });

  it(`Should have total supply ${INIT_SUPPLY}`, async function () {
    expect(await ico.initialSupply()).to.equal(INIT_SUPPLY);
  });
  it(`Should mint initial supply ${INIT_SUPPLY} to owner`, async function () {
    expect(await ico.balanceOf(owner.address)).to.equal(INIT_SUPPLY);
  });
});
