// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ArchiMat.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Calculator is Ownable {
    using Address for address payable;

    ArchiMat private _token;
    mapping(address => uint256) private _credits;
    uint256 private immutable EXCHRATE;

    event CreditsBought(address indexed buyers, uint256 creditsBought);
    event Add(int256 a, int256 b, int256 result);
    event Sub(int256 a, int256 b, int256 result);
    event Mul(int256 a, int256 b, int256 result);
    event Div(int256 a, int256 b, int256 result);
    event Mod(int256 a, int256 b, int256 result);

    constructor(
        address tokenContractAddress,
        address owner_,
        uint256 exchangeRate_
    ) Ownable() {
        _token = ArchiMat(tokenContractAddress);
        transferOwnership(owner_);
        EXCHRATE = exchangeRate_;
    }

    modifier payCredit() {
        require(_credits[msg.sender] != 0, "Calculator: you have no more credits.");
        _credits[msg.sender] -= 1;
        _;
    }

    function buyCredits(uint256 amount) public {
        _buyCredits(amount);
    }

    function add(int256 a, int256 b) public payCredit returns (int256) {
        emit Add(a, b, a + b);
        return a + b;
    }

    function sub(int256 a, int256 b) public payCredit returns (int256) {
        emit Sub(a, b, a - b);
        return a - b;
    }

    function mul(int256 a, int256 b) public payCredit returns (int256) {
        emit Mul(a, b, a * b);
        return a * b;
    }

    function div(int256 a, int256 b) public payCredit returns (int256) {
        require(b != 0, "Calculator: you cannot divide by zero.");
        emit Div(a, b, a / b);
        return a / b;
    }

    function mod(int256 a, int256 b) public payCredit returns (int256) {
        emit Mod(a, b, a % b);
        return a % b;
    }

    function tokenContract() public view returns (address) {
        return address(_token);
    }

    function rate() public view returns (uint256) {
        return EXCHRATE;
    }

    function creditsBalanceOf(address account) public view returns (uint256) {
        return _credits[account];
    }

    function _buyCredits(uint256 amount) private {
        require(
            _token.allowance(msg.sender, address(this)) >= amount,
            "Calculator: you must approve the contract before use it."
        );
        _token.transferFrom(msg.sender, owner(), amount);
        _credits[msg.sender] += amount * EXCHRATE;
        emit CreditsBought(msg.sender, amount * EXCHRATE);
    }
}
