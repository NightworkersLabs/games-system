// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "./CasinoGame.sol";

abstract contract RollingCasinoGame is CasinoGame {
    //
    constructor(
        address trustedValidator_,
        address payable taxReceiver_,
        uint16 taxOnGainsBP_
    ) CasinoGame(trustedValidator_, taxReceiver_, taxOnGainsBP_) {
        // default game rules
        _defineGameRules(.05 ether, 1 ether, 2);
    }

    //
    // CONVERSION AND VALUE LIMIT
    //

    /// maximum betting amount allowed from any game of this contract
    uint256 public CURRENCY_MAX_BET;

    /// minimum betting amount allowed from any game of this contract
    uint256 public CURRENCY_MIN_BET;

    /// define the minimum rolling funds in balance required before allowing bet
    uint256 public MINIMUM_ROLLING = 0;

    /// ensure that we do not consider auto transfer before having X times the minimum rolling funds
    uint8 public SECURITY_MARGIN_MULTIPLIER;

    /// minimum multiplier of CURRENCY_MAX_BET at which contract balance must be to ensure maximum player reward
    function minimumRollingFundsMultiplier()
        public
        pure
        virtual
        returns (uint8);

    //
    //
    //

    receive() external payable {}

    fallback() external payable {}

    //
    //
    //

    /** @notice thrown when rolling funds are missing to met liquidities requirement, and not enough value was attached to said transaction to met the requirement */
    error RollingFundsMissingAndExpected();

    /// allows owner to change game rules
    function defineGameRules(
        uint256 currencyMinBetAmount_,
        uint256 currencyMaxBetAmount_,
        uint8 securityMarginMultiplier_
    ) external payable onlyOwner {
        //
        _defineGameRules(
            currencyMinBetAmount_,
            currencyMaxBetAmount_,
            securityMarginMultiplier_
        );

        // makes sure we feed the missing rolling funds if we set the max bet higher than it was before
        if(msg.value + address(this).balance < MINIMUM_ROLLING) revert("RollingFundsMissingAndExpected");
    }

    /** @notice thrown when trying to configure a security margin multiplier which is less than x2 */
    error SecurityMarginTooLow();

    /** @notice thrown when trying to configure min bet amount as a greater amount than the max bet amount */
    error InvalidMinMaxBetRanges();

    //
    function _defineGameRules(
        uint256 currencyMinBetAmount_,
        uint256 currencyMaxBetAmount_,
        uint8 securityMarginMultiplier_
    ) private {
        //
        if(securityMarginMultiplier_ <= 1) revert("SecurityMarginTooLow");
        if(currencyMinBetAmount_ > currencyMaxBetAmount_) revert("InvalidMinMaxBetRanges");

        //
        CURRENCY_MIN_BET = currencyMinBetAmount_;
        CURRENCY_MAX_BET = currencyMaxBetAmount_;
        SECURITY_MARGIN_MULTIPLIER = securityMarginMultiplier_;

        // minimum rolling is the maximum reward obtainable by a single player on any game of the contract
        MINIMUM_ROLLING =
            currencyMaxBetAmount_ *
            minimumRollingFundsMultiplier();

        // should not think of automatic transfers until at least X times the minimum rolling funds are in balance
        _defineMinimumFundsOnBalance(
            MINIMUM_ROLLING * SECURITY_MARGIN_MULTIPLIER
        );
    }

    //
    // CHECK BALANCE AND BETS
    //

    /** @notice thrown when configured liquidities requirement (minimum rolling funds) is not met */
    error LiquiditiesRequirementNotMet();

    /** @notice thrown when betting too much or too little*/
    error InvalidBetAmount();

    //
    modifier limitExpenses() {
        //
        if(address(this).balance < MINIMUM_ROLLING) revert("LiquiditiesRequirementNotMet");

        //
        if(msg.value < CURRENCY_MIN_BET || msg.value > CURRENCY_MAX_BET) revert("InvalidBetAmount");

        //
        _;
    }
}
