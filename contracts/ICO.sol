//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

//import
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ArchiMat.sol";

/**
 * @title ICO
 * @author Christophe
 * @notice Implements a basic ICO for the ArchiMat token
 * The sale lasts 2 weeks after the deployement.
 */
contract ICO is Ownable {
    using Address for address payable;

    // storage
    ArchiMat private _token;
    uint256 private constant DECIMALS = 18;
    uint256 private constant EXCHRATE = 1000000000;
    uint256 private immutable INITIAL_SUPPLY;
    uint256 private _supply;
    mapping(address => uint256) private _tokenBalances;
    uint256 private _epochIcoStart;
    bool private _isAllowanceApproved = false;

    // events

    event Bought(address indexed account, uint256 amount);
    event Claimed(address indexed account, uint256 amount);

    constructor(address owner_, address tokenAddress_) Ownable() {
        _token = ArchiMat(tokenAddress_);
        transferOwnership(owner_);
        _epochIcoStart = block.timestamp;
        INITIAL_SUPPLY = _token.totalSupply();
        _supply = _token.totalSupply();
    }

    // modifiers
    modifier icoRunning() {
        require(block.timestamp < _epochIcoStart + 2 weeks, "ICO : The ICO is over.");
        _;
    }
    modifier icoOver() {
        require(block.timestamp > _epochIcoStart + 2 weeks, "ICO : The ICO is not over yet.");
        _;
    }

    /**
     * @notice this function handle the case where we send eth directly from the wallet.
     * @dev this function is forwarded to _buyTokens
     */
    receive() external payable {
        _buyTokens(msg.sender, msg.value);
    }

    /**
     * @notice this function allows the user to purchase tokens.
     * @dev this function is forwarded to _buyTokens
     */
    function buyTokens() public payable {
        _buyTokens(msg.sender, msg.value);
    }

    /**
     * @notice Once the ICO is over, a user can claim the purchased tokens.
     */
    function claimTokens() public icoOver {
        require(_tokenBalances[msg.sender] > 0, "ICO : You have no token to claim.");
        uint256 amount = _tokenBalances[msg.sender];
        _tokenBalances[msg.sender] = 0;
        emit Claimed(msg.sender, amount);
        _token.transfer(msg.sender, amount);
    }

    /**
     * @notice Allows the owner to withdraw the profits of the ICO.
     */
    function withdrawIcoProfits() public onlyOwner icoOver {
        require(icoBalance() > 0, "ICO : there is no eth to withdraw.");
        payable(owner()).sendValue(icoBalance());
    }

    /**
     * @notice private function to buy tokens
     */
    function _buyTokens(address sender, uint256 weiAmount_) private icoRunning {
        require(checkAllowance() == true, "ICO : owner (of token) need to approve ICO as a spender");
        require(supply() > 0, "ICO : All the tokens have been sold.");
        uint256 tokenAmount = weiAmount_ / EXCHRATE; // 1 token <=> 10 ** 9 wei

        uint256 diff;
        if (supply() < tokenAmount) {
            diff = tokenAmount - supply();
        }
        uint256 realTokenPurchase = tokenAmount - diff;
        _supply -= realTokenPurchase;
        _tokenBalances[sender] += realTokenPurchase;
        emit Bought(msg.sender, realTokenPurchase);
        _token.transferFrom(owner(), address(this), tokenAmount);
        payable(sender).sendValue(diff * EXCHRATE);
    }

    // Getters

    // function owner() public returns (address) {
    //     return owner_;
    // }

    /**
     * @notice getter for DECIMALS
     */
    function decimals() public pure returns (uint256) {
        return DECIMALS;
    }

    /**
     * @notice getter for EXCHRATE
     */
    function exchRate() public pure returns (uint256) {
        return EXCHRATE;
    }

    /**
     * @notice get the balance of address `account` for the ERC20
     */
    function tokenBalanceOf(address account) public view returns (uint256) {
        return _tokenBalances[account];
    }

    /**
     * @notice get the balance of the ico contract for ethers
     */
    function icoBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice getter for the address where is deployed the ERC20
     */
    function tokenAddress() public view returns (address) {
        return address(_token);
    }

    /**
     * @notice getter for INITIAL_SUPPLY
     */
    function initialSupply() public view returns (uint256) {
        return INITIAL_SUPPLY;
    }

    /**
     * @notice getter for _supply
     */
    function supply() public view returns (uint256) {
        return _supply;
    }

    /**
     * @notice compute the supply sold
     */
    function supplySold() public view returns (uint256) {
        return _token.totalSupply() - supply();
        // return INITIAL_SUPPLY - _supply;
    }

    /**
     * @notice check if the owner has approved the ICO smart-contract as spender
     */
    function checkAllowance() public returns (bool) {
        _isAllowanceApproved = supply() <= _token.allowance(owner(), address(this));
        return _isAllowanceApproved;
    }
}
