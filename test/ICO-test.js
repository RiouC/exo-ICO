const { expect } = require('chai');

describe('ICO', function () {
  this.slow(2000);
  let dev, owner, alice, bob, charlie;
  let ICO, ico, ArchiMat, archimat;
  // INIT_SUPPLY is the initial supply of the ERC20
  // It is a quantity of token
  const INIT_SUPPLY = ethers.utils.parseEther('1000000');
  const ONE_ETHER = ethers.utils.parseEther('1');
  const EXCHRATE = 1000000000;
  // const ONE_GWEI = ethers.utils.parseEther('0.000000001');
  const ONE_GWEI = ONE_ETHER / EXCHRATE;

  beforeEach(async function () {
    [dev, owner, alice, bob, charlie] = await ethers.getSigners();

    ArchiMat = await ethers.getContractFactory('ArchiMat');
    archimat = await ArchiMat.connect(dev).deploy(owner.address, INIT_SUPPLY);
    await archimat.deployed();

    ICO = await ethers.getContractFactory('ICO');
    ico = await ICO.connect(dev).deploy(owner.address, archimat.address);
    await ico.deployed();
  });

  describe('Deployement', function () {
    it(`Should have the correct token address`, async function () {
      expect(await ico.tokenAddress()).to.equal(archimat.address);
    });
    it(`Should have the correct owner`, async function () {
      expect(await ico.owner()).to.equal(owner.address);
    });
  });

  describe('Approve', function () {
    beforeEach(async function () {
      await archimat.connect(owner).approve(ico.address, INIT_SUPPLY);
    });

    it(`Should have approved correctly at least ${INIT_SUPPLY}`, async function () {
      expect(await archimat.allowance(owner.address, ico.address)).to.equal(INIT_SUPPLY);
    });
  });

  describe('ICO is running', function () {
    beforeEach(async function () {
      await archimat.connect(owner).approve(ico.address, INIT_SUPPLY);

      // value is a quantity in eth, so we need to multiply the number of token bought by EXCHRATE
      await ico.connect(alice).buyTokens({ value: 2 * EXCHRATE });
    });
    it(`EXCHRATE and exchRate Should be equal`, async function () {
      const exchRate = await ico.connect(alice).exchRate();
      expect(await ico.exchRate()).to.equal(exchRate);
    });

    it('Should emit a Bought event from ICO', async function () {
      await expect(ico.connect(alice).buyTokens({ value: 3 * EXCHRATE }))
        .to.emit(ico, 'Bought')
        .withArgs(alice.address, 3);
    });
    it('Should emit a Transfer event from ERC20', async function () {
      await expect(ico.connect(alice).buyTokens({ value: 3 * EXCHRATE }))
        .to.emit(archimat, 'Transfer')
        .withArgs(owner.address, ico.address, 3);
    });
    it(`Should decrease the supply.`, async function () {
      expect(await ico.supply()).to.equal(INIT_SUPPLY.sub(2));
    });
    it(`Should increase the supply sold.`, async function () {
      expect(await ico.supplySold()).to.equal(2);
    });
    it(`Check the token balance of the buyer`, async function () {
      expect(await ico.connect(alice).tokenBalanceOf(alice.address)).to.equal(2);
    });
    it(`Check the eth balance of the ico`, async function () {
      expect(await ico.icoBalance()).to.equal(2 * EXCHRATE);
    });
    it(`Check the balance of ICO in ERC20`, async function () {
      expect(await archimat.balanceOf(ico.address)).to.equal(2);
    });
    it(`Check the balance of owner in ERC20`, async function () {
      expect(await archimat.balanceOf(owner.address)).to.equal(INIT_SUPPLY.sub(2));
    });
  });

  describe('ICO is over', function () {
    let ownerERC20Balance;
    beforeEach(async function () {
      await archimat.connect(owner).approve(ico.address, INIT_SUPPLY);
      ownerERC20Balance = await archimat.balanceOf(owner.address);
      await ico.connect(alice).buyTokens({ value: 5 * EXCHRATE });

      let block = await ethers.provider.getBlock();
      let timestamp = block.timestamp;
      console.log(timestamp);
      await ethers.provider.send('evm_increaseTime', [14 * 24 * 3600]);
      await ethers.provider.send('evm_mine');
      block = await ethers.provider.getBlock();
      timestamp = block.timestamp;
      console.log(timestamp);
      await ico.connect(alice).claimTokens();
    });
    it(`Should reset balance of buyer to 0 in ICO balance`, async function () {
      expect(await ico.tokenBalanceOf(alice.address)).to.equal(0);
    });
    it(`Should increase balance of buyer in ERC20 balance`, async function () {
      expect(await archimat.balanceOf(alice.address)).to.equal(5);
    });
    it(`Should decrease balance of owner in ERC20 balance`, async function () {
      expect(await archimat.balanceOf(owner.address)).to.equal(ownerERC20Balance.sub(5));
    });
    // it('Should emit a Transfer event from ERC20', async function () {
    //   await expect(await ico.connect(alice).claimTokens())
    //     .to.emit(archimat, 'Transfer')
    //     .withArgs(ico.address, aiice.address, 5);
    // });
  });

  describe('Withdraw ICO profits', function () {});

  it(`Should have total supply ${INIT_SUPPLY}`, async function () {
    expect(await ico.initialSupply()).to.equal(INIT_SUPPLY);
  });
  // it(`Should mint initial supply ${INIT_SUPPLY} to owner`, async function () {
  //   expect(await ico.balanceOf(owner.address)).to.equal(INIT_SUPPLY);
  // });
});
