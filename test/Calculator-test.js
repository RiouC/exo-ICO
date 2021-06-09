const { expect } = require('chai');

describe('Calculator', function () {
  const TOTAL_SUPPLY = ethers.utils.parseEther('1000');
  const ONE_ETHER = ethers.utils.parseEther('1');
  const RATE = 2;
  let ArchiMat, archimat, Calculator, calc;
  let dev, owner, alice, bob, charlie;
  beforeEach(async function () {
    [dev, owner, alice, bob] = await ethers.getSigners();
    // ERC20 Deployment
    ArchiMat = await ethers.getContractFactory('ArchiMat');
    archimat = await ArchiMat.connect(dev).deploy(owner.address, TOTAL_SUPPLY);
    await archimat.deployed();

    // Calculator Deployment
    Calculator = await ethers.getContractFactory('Calculator');
    calc = await Calculator.connect(dev).deploy(archimat.address, owner.address, RATE);
    await calc.deployed();
  });

  describe('Deployment', function () {
    it('should use the right address contracts', async function () {
      expect(await calc.tokenContract()).to.equal(archimat.address);
    });

    it('should set the owner of the ICO', async function () {
      expect(await calc.owner()).to.equal(owner.address);
    });

    it('should set the rate', async function () {
      expect(await calc.rate()).to.equal(RATE);
    });
  });

  describe('buyCredits() - verification', function () {
    let buyCreditCall;
    let ownerTokenBalance;
    beforeEach(async function () {
      // alice receive token from the owner
      await archimat.connect(owner).transfer(alice.address, 100);
      ownerTokenBalance = await archimat.balanceOf(owner.address);
      await archimat.connect(alice).approve(calc.address, 100);
      buyCreditCall = await calc.connect(alice).buyCredits(10); // RATE = 2, must have 20 credits
    });

    it('should increase the amount of credits after a buy', async function () {
      expect(await calc.creditsBalanceOf(alice.address)).to.equal(20);
    });

    it('should decrease the token balance of the buyer', async function () {
      expect(await archimat.balanceOf(alice.address)).to.equal(90);
    });

    it('should increase the token balance of the owner', async function () {
      expect(await archimat.balanceOf(owner.address)).to.equal(ownerTokenBalance.add(10));
    });

    it('should emit a CreditsBought event', async function () {
      expect(buyCreditCall).to.emit(calc, 'CreditsBought').withArgs(alice.address, 20);
    });

    it('should revert if the buyer did not approve the contract', async function () {
      await expect(calc.connect(alice).buyCredits(200)).to.be.revertedWith(
        'Calculator: you must approve the contract before use it.'
      );
    });

    it('should revert if the buyer have not enough token [ERC20 revert]', async function () {
      await archimat.connect(alice).approve(calc.address, ONE_ETHER.div(10).mul(2000));
      await expect(calc.connect(alice).buyCredits(ONE_ETHER.div(10).mul(1001))).to.be.revertedWith(
        'ERC20: transfer amount exceeds balance'
      );
    });
  });

  describe('Utilisation of arithmetic functions', function () {
    beforeEach(async function () {
      // alice receive token from the owner
      await archimat.connect(owner).transfer(alice.address, 100);
      await archimat.connect(alice).approve(calc.address, 100);
      await calc.connect(alice).buyCredits(10); // RATE = 2, must have 20 credits
    });

    it('should decrease the credits balances of the buyer (modifier)', async function () {
      await calc.connect(alice).add(2, 5);
      await calc.connect(alice).sub(2, 5);
      await calc.connect(alice).mul(2, 5);
      await calc.connect(alice).mod(2, 5);
      await calc.connect(alice).div(2, 5);
      expect(await calc.creditsBalanceOf(alice.address)).to.equal(15);
    });

    it('Should return the correct result [ADD]', async function () {
      expect(await calc.connect(alice).add(5, 9))
        .to.emit(calc, 'Add')
        .withArgs(5, 9, 14);
    });
    it('Should return the correct result [SUB]', async function () {
      expect(await calc.connect(alice).sub(3, 5))
        .to.emit(calc, 'Sub')
        .withArgs(3, 5, -2);
    });
    it('Should return the correct result [MUL]', async function () {
      expect(await calc.connect(alice).mul(3, 9))
        .to.emit(calc, 'Mul')
        .withArgs(3, 9, 27);
    });
    it('Should return the correct result [MOD]', async function () {
      expect(await calc.connect(alice).mod(3, 4))
        .to.emit(calc, 'Mod')
        .withArgs(3, 4, 3);
    });
    it('Should return the correct result [DIV]', async function () {
      expect(await calc.connect(alice).div(4, 4))
        .to.emit(calc, 'Div')
        .withArgs(4, 4, 1);
    });

    it('should revert if div() is called with a zero at 2nd parameter', async function () {
      await expect(calc.connect(alice).div(4, 0)).to.be.revertedWith('Calculator: you cannot divide by zero.');
    });

    it('should revert if the credits balance is at zero', async function () {
      await expect(calc.connect(bob).add(2, 4)).to.be.revertedWith('Calculator: you have no more credits.');
    });
  });
});
