// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "../base/TrustedValidatorLeaned.sol";

import "../base/AutomaticTransferer.sol";

abstract contract CasinoGame is AutomaticTransferer, TrustedValidatorLeaned {
    /// represents the percent of tax applied on rewards won by players that we keep in balance
    uint16 public taxOnGainsInBasePoints;

    //
    constructor(
        address trustedValidator_,
        address payable taxReceiver_,
        uint16 taxOnGainsBP_
    ) AutomaticTransferer(taxReceiver_, 10 ether) {
        //
        _addTrustedValidator(trustedValidator_);
        _defineTaxOnGains(taxOnGainsBP_);
    }

    ///
    function defineTaxOnGains(uint16 basePoint_) external onlyOwner {
        _defineTaxOnGains(basePoint_);
    }

    /** @notice thrown when newly set tax on gains represents more than 100% of gains */
    error NewTaxOnGainsTooHigh();

    ///
    function _defineTaxOnGains(uint16 basePoint_) private {
        if(basePoint_ > 10_000) revert("NewTaxOnGainsTooHigh");
        taxOnGainsInBasePoints = basePoint_;
    }

    //
    // TAX
    //

    /// returns an amount MINUS tax
    function _applyTaxOnCurrencyAmount(uint256 currencyAmount_)
        private
        view
        returns (uint256)
    {
        return currencyAmount_ - _getTaxPart(currencyAmount_);
    }

    /// get only the tax part of an amount
    function _getTaxPart(uint256 amount_) private view returns (uint256) {
        return (amount_ / 10_000) * taxOnGainsInBasePoints;
    }

    //
    // CHECK BALANCE AND BETS
    //

    /// apply taxes on bet amount, then use multiplier and send it to the player
    function _payPlayerTaxedReward(
        address playerToPay_,
        uint256 betAmount_,
        uint8 multiplier_
    ) internal returns (uint256 rewarded_) {
        //
        rewarded_ = _applyTaxOnCurrencyAmount(betAmount_) * multiplier_;

        //
        payable(playerToPay_).transfer(rewarded_);
    }

    // pay multiple players with taxed rewards from the total untaxed amount
    function _payManyPlayersTaxedRewards(
        address[] memory playersToPay_,
        uint256 totalUntaxedReward_
    ) internal returns (uint256 taxedRewardByPlayer_) {
        // know how much we need to transfer
        taxedRewardByPlayer_ = _getTaxedRewardOfMany(
            playersToPay_.length,
            totalUntaxedReward_
        );

        //
        for (uint256 i_; i_ < playersToPay_.length; i_++) {
            // do not burn !
            if (playersToPay_[i_] == address(0)) continue;

            // transfer taxed amount...
            payable(playersToPay_[i_]).transfer(taxedRewardByPlayer_);
        }
    }

    /// get the taxed reward that each player that won will get
    function _getTaxedRewardOfMany(
        uint256 playersCount,
        uint256 totalUntaxedReward_
    ) internal view returns (uint256) {
        return _applyTaxOnCurrencyAmount(totalUntaxedReward_) / playersCount;
    }
}
