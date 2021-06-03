const { expect } = require('chai');

describe('ArchiMat', async function () {
  this.slow(2000);
  let dev, owner, alice, bob, charlie, ArchiMat, archimat;
  const NAME = 'ArchiMat';
  const SYMBOL = 'AMAT';
  const INIT_SUPPLY = ethers.utils.parseEther('10000000000');

  beforeEach(async function () {
    [dev, owner] = await ethers.getSigners();

    ArchiMat = await ethers.getContractFactory('ArchiMat');
    archimat = await ArchiMat.connect(dev).deploy(owner.address, INIT_SUPPLY);
    await archimat.deployed();
  });

  it(`Should have name ${NAME}`, async function () {
    expect(await archimat.name()).to.equal(NAME);
  });
  it(`Should have symbol ${SYMBOL}`, async function () {
    expect(await archimat.symbol()).to.equal(SYMBOL);
  });
  it(`Should have total supply ${INIT_SUPPLY}`, async function () {
    expect(await archimat.totalSupply()).to.equal(INIT_SUPPLY);
  });
  it(`Should mint initial supply ${INIT_SUPPLY} to owner`, async function () {
    expect(await archimat.balanceOf(owner.address)).to.equal(INIT_SUPPLY);
  });
});
