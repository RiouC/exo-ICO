//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

//import
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ArchiMat.sol";

contract ICO is Ownable {
    using Address for address payable;

    ArchiMat private _token;
    // address private _owner;
    uint256 private constant DECIMALS = 18;
    uint256 private constant EXCHRATE = 1000;
    uint256 private immutable INITIAL_SUPPLY = _token.totalSupply();
    uint256 private _supply = _token.totalSupply();
    mapping(address => uint256) private _tokenBalances;
    uint256 private _epochIcoStart;
    bool private _isAllowanceApproved = false;

    constructor(address owner_, address tokenAddress_) Ownable() {
        _token = ArchiMat(tokenAddress_);
        transferOwnership(owner_);
        _epochIcoStart = block.timestamp;
    }

    modifier icoRunning() {
        require(block.timestamp < _epochIcoStart + 2 weeks, "ICO : The ICO is over.");
        _;
    }

    modifier icoOver() {
        require(block.timestamp > _epochIcoStart + 2 weeks, "ICO : The ICO is not over yet.");
        _;
    }

    receive() external payable {
        _buyTokens(msg.sender, msg.value);
    }

    function buyTokens() public payable {
        _buyTokens(msg.sender, msg.value);
    }

    function claimTokens() public icoOver {
        require(_tokenBalances[msg.sender] > 0, "ICO : You have no token to claim.");
        uint256 amount = _tokenBalances[msg.sender];
        _tokenBalances[msg.sender] = 0;
        _token.transfer(msg.sender, amount);
    }

    function withdrawIcoProfits() public onlyOwner icoOver {
        require(icoBalance() > 0, "ICO : there is no eth to withdraw.");
        payable(owner()).sendValue(icoBalance());
    }

    function _buyTokens(address sender, uint256 amount) private icoRunning {
        require(_isAllowanceApproved == true, "ICO : owner (of token) need to approve ICO as a spender");
        require(supply() > 0, "ICO : All the tokens have been sold.");
        uint256 tokenAmount = amount / EXCHRATE; // 1 token <=> 1000 wei

        uint256 diff;
        if (supply() < tokenAmount) {
            diff = tokenAmount - supply();
        }
        _supply -= tokenAmount - diff;
        _tokenBalances[sender] += tokenAmount - diff;
        _token.transferFrom(owner(), address(this), tokenAmount);
        payable(sender).sendValue(diff * EXCHRATE);
    }

    // Getters

    // function owner() public returns (address) {
    //     return owner_;
    // }
    function decimals() public pure returns (uint256) {
        return DECIMALS;
    }

    function exchRate() public pure returns (uint256) {
        return EXCHRATE;
    }

    function tokenBalanceOf(address account) public view returns (uint256) {
        return _tokenBalances[account];
    }

    function icoBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function tokenAddress() public view returns (address) {
        return address(_token);
    }

    function initialSupply() public view returns (uint256) {
        return INITIAL_SUPPLY;
    }

    function supply() public view returns (uint256) {
        return _supply;
    }

    function supplySold() public view returns (uint256) {
        return INITIAL_SUPPLY - _supply;
    }

    function checkAllowance() public returns (bool) {
        _isAllowanceApproved = supply() <= _token.allowance(owner(), address(this));
        return _isAllowanceApproved;
    }
}
