// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ArchiMat is ERC20 {
    constructor(address initialSupplyOwner_, uint256 initialSupply) ERC20("ArchiMat", "AMAT") {
        _mint(initialSupplyOwner_, initialSupply);
    }
}
