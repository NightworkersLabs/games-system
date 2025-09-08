// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract WhitelistPayableMint is Ownable {
    //
    enum MintingState {
        Closed,
        WhitelistPeriod,
        OpenToPublic
    }

    /// number of tickets that can grant an address a reduced mint price while in WhitelistPeriod
    mapping(address => uint8) private _whitelistTicketsLeft;

    ///
    MintingState internal _mintingState;

    //
    event WhitelistedAllowed();
    event GameLaunchedForPublic();
    event WhitelistTicketsGranted(address[] concerned, uint8 granted);

    //
    // PUBLIC
    //

    /** @notice thrown when the amount of addresses to whitelist is not withing configured ranges */
    error WhitelistingIncorrectAmount();

    /**
     * OWNER ONLY
     */
    function grantManyWhitelistTickets(
        address[] calldata addrs_,
        uint8 howMuch_
    ) external onlyOwner {
        //
        if(addrs_.length > 100 || addrs_.length == 0) revert("WhitelistingIncorrectAmount");

        //
        for (uint256 i_; i_ < addrs_.length; i_++) {
            _whitelistTicketsLeft[addrs_[i_]] += howMuch_;
        }

        //
        emit WhitelistTicketsGranted(addrs_, howMuch_);
    }

    /** @notice thrown when launching WL period would not make sense (eg, already in WL state, or already launched) */
    error WhitelistPeriodObsolete();

    /**
     * OWNER ONLY
     */
    function declareWhitelistPeriod() external onlyOwner {
        if(_mintingState != MintingState.Closed) revert("WhitelistPeriodObsolete");
        _mintingState = MintingState.WhitelistPeriod;
        emit WhitelistedAllowed();
    }

    /** @notice thrown when trying to publically launch when it already is */
    error AlreadyLaunched();

    /**
     * OWNER ONLY
     * @dev ends whitelist privileges and restrictions
     */
    function declarePublicLaunch() external onlyOwner {
        if(_mintingState == MintingState.OpenToPublic) revert("AlreadyLaunched");
        _mintingState = MintingState.OpenToPublic;
        emit GameLaunchedForPublic();
    }

    //
    // PUBLIC VIEW
    //

    /** checks whenever we can mint if whitelisted */
    function isInWhitelistPeriod() external view returns (bool) {
        return _mintingState == MintingState.WhitelistPeriod;
    }

    /** checks whenever we can mint without special authorization (whitelist...) */
    function isPubliclyLaunched() external view returns (bool) {
        return _mintingState == MintingState.OpenToPublic;
    }

    /**
     * Get how many tokens you can mint at reduced price as whitelisted
     * @return how many tokens you can mint
     */
    function usableWhitelistTicketsLeft() public view returns (uint8) {
        // if open to public, no more WL tokens
        if (_mintingState == MintingState.OpenToPublic) return 0;

        // check if has some left...
        return _whitelistTicketsLeft[_msgSender()];
    }

    //
    // INTERNAL
    //

    /** @notice thrown when trying to mint more reduced-price tickets as privileged whitelist than left for you */
    error MintingTooMuchWhitelistedTickets();

    /**
     * @dev minting gate for whitelisted users, and registering WL tokens if required
     * @param howMany_ how many token to mint
     */
    function _shouldBeWhitelistedMint(address minter_, uint8 howMany_)
        internal
        returns (bool isWL_)
    {
        //
        if (_mintingState != MintingState.WhitelistPeriod) return false;

        //
        if(howMany_ > _whitelistTicketsLeft[minter_]) revert("MintingTooMuchWhitelistedTickets");

        //
        _whitelistTicketsLeft[minter_] -= howMany_;
        return true;
    }
}
