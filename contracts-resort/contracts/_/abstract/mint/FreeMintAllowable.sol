// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract FreeMintAllowable is Ownable {
    // 
    mapping(address => uint8) private _freeMints;

    //
    event FreeMintsGiven(address indexed receiver, uint8 howMany);
    event FreeMintsUsed(address indexed user, uint8 howMany);

    //
    // PUBLIC
    //

    /**
     * OWNER ONLY
     *
     */
    function giveFreeMintsForMany(address[] calldata addrs_, uint8 howMany_)
        external
        onlyOwner
    {
        for (uint256 i_ = 0; i_ < addrs_.length; i_++) {
            _freeMints[addrs_[i_]] += howMany_;
            emit FreeMintsGiven(addrs_[i_], howMany_);
        }
    }

    //
    // PUBLIC VIEW
    //

    /** */
    function freeMintsRemaining() external view returns (uint8) {
        return _freeMintsRemaining(_msgSender());
    }

    //
    // PRIVATE
    //

    function _freeMintsRemaining(address toCheck_)
        internal
        view
        returns (uint8)
    {
        return _freeMints[toCheck_];
    }

    /**
     * remove free mint to caller
     */
    function _removeFreeMints(address from_, uint8 howMany_) internal {
        _freeMints[from_] -= howMany_;
        emit FreeMintsUsed(from_, howMany_);
    }
}
