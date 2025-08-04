// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "../../interface/INightworkersGame.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract NightworkersInteractor is Ownable {
    //
    INightworkersGame internal _mGame;

    /**
     * OWNER ONLY
     * Binds a a game contract reference to this contract to be able to interact with it
     * @param game_ game contract address
     */
    function setMintingGame(INightworkersGame game_) external onlyOwner {
        _mGame = INightworkersGame(game_);
    }

    /** @notice thrown when anything but the expected offical minting game uses bound contract call */
    error OnlyMinterAllowed();

    /**
     * @dev Throws if called by any account other than the owner or game.
     */
    modifier onlyMintingGame() {
        if(_msgSender() != address(_mGame)) revert("OnlyMinterAllowed");
        _;
    }
}
