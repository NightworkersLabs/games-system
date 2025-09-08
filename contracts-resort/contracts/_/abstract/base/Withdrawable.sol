// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

abstract contract Withdrawable is Ownable, Pausable {
    /**
     * OWNER ONLY
     * allows owner to withdraw this contract funds
     * @dev no reentracy-guard needed
     */
    function withdrawAll() external onlyOwner {
        // https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "withdrawAll() failed.");
    }

    /**
     * OWNER ONLY
     * allows owner to withdraw some funds from this contract
     * @dev no reentracy-guard needed
     */
    function withdraw(uint256 amount_) external onlyOwner {
        // https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/
        (bool success, ) = owner().call{value: amount_}("");
        require(success, "withdraw() failed.");
    }

    /**
     * OWNER ONLY
     * enables owner control the ability to mint
     * @param paused_ should pause / unpause minting
     */
    function setPaused(bool paused_) external {
        if (paused_) doPause();
        else doUnpause();
    }

    /**
     * OWNER ONLY
     */
    function doUnpause() public virtual onlyOwner {
        _unpause();
    }

    /**
     * OWNER ONLY
     */
    function doPause() public virtual onlyOwner {
        _pause();
    }

    /** @notice thrown when a contract tries to call the bound function */
    error OnlyEOA();

    /** checks that no smart contracts can use the functions that use this modifier */
    modifier onlyEOA() {
        if(_msgSender() != tx.origin) revert("OnlyEOA");
        _;
    }
}
