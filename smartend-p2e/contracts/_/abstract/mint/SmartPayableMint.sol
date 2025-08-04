// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "./WhitelistPayableMint.sol";
import "./FreeMintAllowable.sol";

abstract contract SmartPayableMint is WhitelistPayableMint {
    //
    enum MintingPriceType {
        Base,
        Whitelisted,
        Scarce
    }

    /// limit until SCARCE tax applies for minting payable tokens
    function _willTokenGetScarce(uint16 tokenId)
        internal
        view
        virtual
        returns (bool);

    /// checks if next token to be minted is a scarce one
    function _isNextTokenScarce() internal view virtual returns (bool);

    /// percent of discount applied for whitelisted users on minting payable
    uint8 public constant WL_DISCOUNT_PRC = 20;

    /// percent of tax applied when minting payable get scarce
    uint8 public constant SCARCE_TAX_PRC = 20;

    //
    uint256 private _BASE_PRICE;
    uint256 private _WL_PRICE;
    uint256 private _SCARCE_PRICE;

    //
    constructor(uint256 _payableMintPrice) {
        _changeBasePayableMintPrice(_payableMintPrice);
    }

    //
    event BasePayableMintPriceChanged(uint256 oldPrice, uint256 newPrice);

    //
    // PUBLIC
    //

    /**
     * OWNER ONLY
     * Changes price of the standard minted token.
     * Also affects whitelisted token price while not in public lauch mode.
     * @param newPrice_ mint price to apply
     */
    function changeBasePayableMintPrice(uint256 newPrice_) external onlyOwner {
        emit BasePayableMintPriceChanged(_BASE_PRICE, newPrice_);
        _changeBasePayableMintPrice(newPrice_);
    }

    //
    // PUBLIC VIEW
    //

    /// default mint price of a single payable token
    function getBasePayableMintPrice() external view returns (uint256) {
        return getPayableMintPriceOf(MintingPriceType.Base);
    }

    /// default mint price of a single token for whitelisted users while in whitelist period
    function getWhitelistedPayableMintPrice() external view returns (uint256) {
        return getPayableMintPriceOf(MintingPriceType.Whitelisted);
    }

    /// default mint price of a single scarce token
    function getScarcePayableMintPrice() external view returns (uint256) {
        return getPayableMintPriceOf(MintingPriceType.Scarce);
    }

    /**
     * get the price for the specific price type
     * @param priceType_ type of pricing you want to get the price of
     * @return price of the bound pricetype
     */
    function getPayableMintPriceOf(MintingPriceType priceType_)
        public
        view
        returns (uint256)
    {
        if (priceType_ == MintingPriceType.Scarce) return _SCARCE_PRICE;
        else if (priceType_ == MintingPriceType.Whitelisted) return _WL_PRICE;
        else return _BASE_PRICE;
    }

    /**
     * get an estimation in ether price of the next token to be minted
     */
    function estimatePayableMintPrice() external view returns (uint256 price_) {
        bool isWLState_ = usableWhitelistTicketsLeft() > 0;
        (, price_) = _estimatePayableMintPrice(isWLState_);
    }

    //
    // PRIVATE
    //

    /** @notice */
    error InvalidBasePrice();

    /** */
    function _changeBasePayableMintPrice(uint256 newPrice_) private {
        //
        if(newPrice_ < .01 ether) revert("InvalidBasePrice");

        //
        _SCARCE_PRICE = newPrice_ + (newPrice_ * SCARCE_TAX_PRC) / 100;
        _WL_PRICE = newPrice_ - (newPrice_ * WL_DISCOUNT_PRC) / 100;
        _BASE_PRICE = newPrice_;
    }

    //
    // PRIVATE VIEW
    //

    /** @notice thrown when price does evolve within a mint order (eg, from base price on 1st token to scarce price on last) */
    error PriceChangingWithinOrder();

    /**
     * combines checks and price fetching
     */
    function _getPayableMintPrice(
        bool isWLState_,
        uint16 exepectedMintedTokenId_
    ) internal view returns (uint256 price_) {
        //
        MintingPriceType mpt_;
        (mpt_, price_) = _estimatePayableMintPrice(isWLState_);

        // make sure price does not evolve between next token and last token
        if (mpt_ != MintingPriceType.Scarce && _willTokenGetScarce(exepectedMintedTokenId_)) {
            revert("PriceChangingWithinOrder");
        }
    }

    /**
     * get an estimation in ether price of the next token to be minted
     */
    function _estimatePayableMintPrice(bool isWLState_)
        private
        view
        returns (MintingPriceType, uint256)
    {
        //
        if (isWLState_) {
            return _getPayableMintPriceOf(MintingPriceType.Whitelisted);
        }

        //
        if (_isNextTokenScarce()) {
            return _getPayableMintPriceOf(MintingPriceType.Scarce);
        }

        //
        return _getPayableMintPriceOf(MintingPriceType.Base);
    }

    //
    function _getPayableMintPriceOf(MintingPriceType priceType_)
        private
        view
        returns (MintingPriceType, uint256)
    {
        return (priceType_, getPayableMintPriceOf(priceType_));
    }
}
