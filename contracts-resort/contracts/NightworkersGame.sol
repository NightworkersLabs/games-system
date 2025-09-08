// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";

import "./_/abstract/mint/SmartPayableMint.sol";

import "./_/abstract/base/Withdrawable.sol";
import "./_/abstract/base/TrustedValidatorLeaned.sol";
import "./_/abstract/base/TrustedValidatorLeaned.sol";

import "./_/interface/INightworkersGame.sol";
import "./_/interface/IRedLightDistrict.sol";
import "./_/interface/ICandyMachine.sol";
import "./_/interface/ILOLLY.sol";

contract NightworkersGame is
    INightworkersGame,
    ERC721Enumerable,
    ERC721Royalty,
    SmartPayableMint,
    FreeMintAllowable,
    Withdrawable,
    TrustedValidatorLeaned
{
    /// number of tokens that have been minted so far, also is the last minted token ID. First token minted has ID n°1
    uint16 public minted;

    /// max number of mintable tokens at once by a player. Would produce only Pimps past the 32th same-Tx minted NFTs
    uint8 public MAX_MINT = 30;
    /// max number of tokens that can be minted
    uint16 public immutable MAX_TOKENS;

    /// token ID above which minting tokens costs LOLLY instead of ether
    uint16 public immutable PAYABLE_TOKENS_UNTIL;
    /// token ID above which a payable token gets scarce, eg. pricier
    uint16 public immutable PAYABLE_TOKENS_SCARCE_AT;
    /// token ID above which a token gets pricier 
    uint16 public immutable PRICIER_TOKEN_AT;
    /// token ID above which a token gets even pricier 
    uint16 public immutable EVEN_PRICIER_TOKEN_AT;

    /// base price in $LOLLY for a single mint
    uint256 public constant MINT_BASE_PRICE = 20_000 ether;
    uint256 public constant PRICIER_TOKEN_PRICE = MINT_BASE_PRICE * 2;
    uint256 public constant EVEN_PRICIER_TOKEN_PRICE = MINT_BASE_PRICE * 3;

    /// notoriety score of the most common Pimp
    uint8 public constant override MIN_PIMP_NOTORIETY_SCORE = 5;
    /// notoriety score of the most rare Pimp
    uint8 public constant override MAX_PIMP_NOTORIETY_SCORE = 8;

    /// reference to the RedLightDistrict Contract
    IRedLightDistrict public immutable redLightDistrict;
    /// reference to LOLLY Contract
    ILOLLY public immutable lolly;
    /// reference to CandyMachine Contract
    ICandyMachine public immutable candyMachine;

    /** @notice */
    error InvalidMaxMint();

    //
    constructor(
        address trustedValidator_,
        ILOLLY lolly_,
        ICandyMachine candyMachine_,
        IRedLightDistrict redLightDistrict_,
        address payable gameCreatorPay_,
        uint16 maxTokens_,
        uint256 payablePrice_
    ) ERC721("Night Workers P2E", "Nightworkers") SmartPayableMint(payablePrice_) {

        //
        // MINT BOUNDARIES
        //

        // checking that we do not set the maximum amount of tokens too low
        if (maxTokens_ < 100) revert("InvalidMaxMint");

        //
        MAX_TOKENS = maxTokens_;

        // 20%
        PAYABLE_TOKENS_UNTIL = maxTokens_ / 5;

        // last 10% of payable
        PAYABLE_TOKENS_SCARCE_AT =
            PAYABLE_TOKENS_UNTIL -
            (PAYABLE_TOKENS_UNTIL / 10);

        //
        PRICIER_TOKEN_AT = uint16((uint256(maxTokens_) * 2) / 5);

        //
        EVEN_PRICIER_TOKEN_AT = uint16((uint256(maxTokens_) * 4) / 5);

        //
        // ROYALTIES
        //

        // Recipient address for fees + royalties applied on sale prices, expressed in base points (eq. 5 percent)
        _setDefaultRoyalty(gameCreatorPay_, 500);

        //
        // ROUTING & AUTHORIZATIONS
        //

        //
        _addTrustedValidator(trustedValidator_);

        //
        lolly = lolly_;
        candyMachine = candyMachine_;
        redLightDistrict = redLightDistrict_;
    }

    // #if DEBUG

    /**
     * OWNER ONLY
     * controls the current minted token
     * @dev pass as 'internal' to allow debuging with 'hardhat-exposed'
     */
    function _setMinted(uint16 minted_) internal onlyOwner {
        minted = minted_;
    }

    // #endif

    /*** EXTERNAL */

    /** @notice thrown when minting is not yet available */
    error MintClosedForNow();

    /** @notice thrown when the minting quantity is not positive and within configured range */
    error InvalidMintQuantity();

    /** @notice thrown when trying to mint more than the total supply of tokens allows you to */
    error NotEnoughTokensLeft();

    /** @notice thrown when trying to mint more free tokens than available to you */
    error MintingTooMuchFreeTokens();

    /** @notice thrown when not giving ETH to the tx, and expecting some */
    error MintRequiresPayment();

    /** @notice thrown when the LOLLY price of a token changes while minting (eg, jumping from 40k to 60k mid-tx) */
    error LOLLYPriceChangesWhileMinting();

    /** @notice thrown when your LOLLY balance cannot satisfy the required amount expected to mint wanted tokens */
    error InsufficientLOLLYBalance();

    /** @notice thrown when giving ETH for mints, and not expected to */
    error ShouldOnlyPayWithLOLLY();

    /** @notice thrown when trying to mint tokens which sit inbetween ETH-payable tokens and LOLLY-payable tokens */
    error WouldSoldoutGen0();

    /** @notice thrown when ETH mint price bound to the tx is incorrect */
    error InvalidMintsPrice();

    /** */
    event MintOrdered(
        uint16 indexed atMinted,
        address indexed minter,
        uint16 howMany,
        uint8 generation
    );

    /**
     * order and pay for mints, to be processed later by a trusted validator
     * The first 20 percent must be payable with ETH to claim, the remaining cost $LOLLY
     * @dev Ensures payable value does not vary while handling transaction
     * @param howMany_ number of tokens to order
     */
    function orderMint(uint8 howMany_, TrustfulOrderPayload calldata payload_)
        external
        payable
        whenNotPaused
        onlyEOA
        trustedValidatorOrder(payload_)
    {
        // should not be closed
        if(_mintingState == MintingState.Closed) revert("MintClosedForNow");

        // check that mint amount is in range
        if(howMany_ == 0 || howMany_ > MAX_MINT) revert("InvalidMintQuantity");

        // check remaining tokens to be minted
        uint16 exepectedMintedTokenId_ = minted + howMany_;
        if(exepectedMintedTokenId_ > MAX_TOKENS) revert("NotEnoughTokensLeft");

        //
        uint16 firstToBeMinted_ = _nextToken();
        bool arePayableTokens_ = _isPayableToken(firstToBeMinted_);
        uint256 totalLollyCost_;

        // if not giving ETH...
        if (msg.value == 0) {
            // check if has free mints
            uint256 remainingFree_ = _freeMintsRemaining(_msgSender());

            // if has free mints...
            if (remainingFree_ != 0) {
                // makes sure not requesting more free mints than available
                if(howMany_ > remainingFree_) revert("MintingTooMuchFreeTokens");

                // remove from free mints
                _removeFreeMints(_msgSender(), howMany_);
            }
            // if has not free mints, must pay with $LOLLY
            else {
                // make sure we are gen 1 and not gen 0
                if(arePayableTokens_ == true) revert("MintRequiresPayment");

                // check if $LOLLY price changes between first and last mint
                uint256 expectedUnaryMintCost = _lollyMintCostOf(
                    firstToBeMinted_
                );
                if(expectedUnaryMintCost != _lollyMintCostOf(exepectedMintedTokenId_)) revert("LOLLYPriceChangesWhileMinting");

                // compute $LOLLY cost
                totalLollyCost_ = expectedUnaryMintCost * howMany_;

                // check $LOLLY balance
                if(lolly.balanceOf(_msgSender()) < totalLollyCost_) revert("InsufficientLOLLYBalance");

                // burning $LOLLY
                if (totalLollyCost_ > 0)
                    lolly.burn(_msgSender(), totalLollyCost_);
            }
        }
        // if giving ETH...
        else {
            // make sure we pay for gen 0 and not gen 1
            if(arePayableTokens_ == false) revert("ShouldOnlyPayWithLOLLY");

            // should not want to mint more than there will be payable tokens
            if(exepectedMintedTokenId_ > PAYABLE_TOKENS_UNTIL) revert("WouldSoldoutGen0");

            // check we must use WL tickets
            bool isWL_ = _shouldBeWhitelistedMint(_msgSender(), howMany_);

            // we do not want price to change while minting
            uint256 priceToApply_ = _getPayableMintPrice(
                isWL_,
                exepectedMintedTokenId_
            );

            // makes sure the right amount is supplied
            if(howMany_ * priceToApply_ != msg.value) revert("InvalidMintsPrice");
        }

        //
        // EMIT : notify the validator bot that an order can be handled
        //

        emit MintOrdered(
            firstToBeMinted_,
            _msgSender(),
            howMany_,
            arePayableTokens_ ? 0 : 1
        );
        _traceTrustfulOrder(TrustedPurpose.Mint, firstToBeMinted_, payload_);

        //
        // UPDATE : minted state storage updated at once, save some gas
        //

        minted = exepectedMintedTokenId_;
    }

    /** */
    event MintOrderProcessed(
        uint16 indexed atMinted,
        uint16 ownedCount,
        uint16 stolenCount
    );

    /** */
    event MintStolen(
        address indexed from,
        address indexed to,
        uint16 indexed stealerTokenId,
        uint16 stolenTokenId
    );

    /**
     * called by a trusted validator bot to process a mint order
     * Gen 1 tokens can be stolen
     * @dev Ensures payable value does not vary while handling transaction
     * @dev optimized for branch prediction and prevents cache miss
     * @param minter_ address who ordered the mint operation
     * @param atMinted_ order number, it is the first token ID to mint
     * @param howMany_ number of tokens to mint
     * @param generation_ gen of the token to be minted
     * @param payload_ provably fair payload provided by validator
     */
    function processMintOrder(
        uint16 atMinted_,
        address minter_,
        uint16 howMany_,
        uint8 generation_,
        TrustfulResponsePayload calldata payload_
    ) external trustedValidatorOnly(payload_) {
        // prepare...
        address[] memory ownersToGreet_ = new address[](howMany_);
        uint256 i_;
        uint16 stolenCount_;

        //
        // GENERATE : picks traits for tokens && find owner
        //

        {
            // prepare...
            uint16 tokenIdToMint_;
            uint256 seed_ = payload_.randomNumber;
            uint8 typeSeed_;
            address recipient_;
            uint16 stealer_;

            // loop each token
            for (i_; i_ < howMany_; i_++) {
                //
                tokenIdToMint_ = uint16(atMinted_ + i_);

                // get seeds from the newly to-be-minted token ID
                seed_ = uint256(
                    keccak256(
                        abi.encodePacked(tokenIdToMint_, typeSeed_, seed_)
                    )
                ); // rehash to emulate new randomness
                typeSeed_ = uint8(payload_.randomNumber >> (i_ * 8)); // each time get the next 8 bits to determine type of night worker

                // generate a unique NFT from the first 128 bits
                candyMachine.generateUnique(
                    tokenIdToMint_,
                    generation_,
                    uint128(seed_),
                    typeSeed_
                );

                // get which would be the expected owner of this token
                if (generation_ == 0) {
                    // if gen 0, always goes to the minter
                    recipient_ = minter_;
                } else {
                    // if gen 1, may determine alternative owner
                    (recipient_, stealer_) = _maySelectAlternativeRecipient(
                        minter_,
                        seed_
                    );

                    // if a stealer could be picked
                    if (stealer_ != 0) {
                        //
                        stolenCount_++;

                        // emit an event
                        emit MintStolen(
                            minter_,
                            recipient_,
                            stealer_,
                            tokenIdToMint_
                        );
                    }
                }

                //
                ownersToGreet_[i_] = recipient_;
            }
        }

        //
        // MINT : give token to its owner
        //

        for (i_ = 0; i_ < ownersToGreet_.length; i_++) {
            _safeMint(ownersToGreet_[i_], atMinted_ + i_);
        }

        //
        // EMIT : notify the back
        //

        emit MintOrderProcessed(
            atMinted_,
            howMany_ - stolenCount_,
            stolenCount_
        );
        _traceTrustfulResponse(TrustedPurpose.Mint, atMinted_, payload_);
    }

    /** @notice thrown when wanted token is not within expected bounds */
    error OutOfBoundToken();

    /**
     * the first 20 percent are payable in blockchain currency
     * the remaning is payable with $LOLLY
     * @param tokenId_ the ID to check the cost of to mint
     * @return the cost of the given token ID
     */
    function lollyMintCostOf(uint16 tokenId_) public view returns (uint256) {
        if(tokenId_ == 0 || tokenId_ > MAX_TOKENS) revert("OutOfBoundToken");

        /* GEN 0 */
        if (_isPayableToken(tokenId_)) return 0;

        /* GEN 1+ */
        return _lollyMintCostOf(tokenId_);
    }

    /**
     * @dev ignores payable toLOLLY
     * the first 40 percent are 20.LOLLY$LOLLY
     * the next 40 percent are 40.000 $LOLLY
     * the final 20 percent are 60.000 $LOLLY
     * @param tokenId_ the ID to check the cost of to mint
     * @return the cost of the given token ID
     */
    function _lollyMintCostOf(uint16 tokenId_) private view returns (uint256) {
        if (tokenId_ <= PRICIER_TOKEN_AT) return MINT_BASE_PRICE;
        else if (tokenId_ <= EVEN_PRICIER_TOKEN_AT) return PRICIER_TOKEN_PRICE;
        else return EVEN_PRICIER_TOKEN_PRICE;
    }

    /**
     * Estimated mint cost in $LOLLY for the next token to be minted
     */
    function lollyMintCost() external view returns (uint256) {
        return lollyMintCostOf(_nextToken());
    }

    /**
     * Gets next token which might be minted
     */
    function _nextToken() private view returns (uint16) {
        return minted + 1;
    }

    /**
     * @return if tokenId corresponds to a payable token
     */
    function _isPayableToken(uint16 tokenId_) private view returns (bool) {
        return tokenId_ <= PAYABLE_TOKENS_UNTIL;
    }

    /*** PRIVATE */

    /**
     * the first 20 percent (ETH purchases) go to the minter
     * the remaining 80 percent have a high 10 percent chance (accounting modulo bias) to be given to a random staked pimp
     * @param minter_ address of the minter
     * @param seed_ a random value to select a recipient from
     * @return definitiveRecipient_ address of the recipient (either the minter or the Pimp's owner)
     * @return stealerId_ token id of the pimp that may have stolen
     */
    function _maySelectAlternativeRecipient(address minter_, uint256 seed_)
        private
        view
        returns (address definitiveRecipient_, uint16 stealerId_)
    {
        //
        if (_mayTokenBeKeptByMinter(seed_)) {
            return (minter_, 0);
        }

        // do not use the first 128 bits as they were already used for traits selection
        // use the last 128 bits to determine the stealer pimp
        return redLightDistrict.mayPickStealerPimp(minter_, seed_ >> 128);
    }

    /// avg. 90 percent of the time, the recipient is the actual minter (Noice !)
    function _mayTokenBeKeptByMinter(uint256 seed_)
        internal
        pure
        returns (bool)
    {
        // use the last 8 bits arbitrarily
        return (seed_ >> 248) % 10 != 0;
    }

    /***READ */

    /**
     * checks if a token is a Hooker
     * @param tokenId_ the ID of the token to check
     * @return whether or not a token is a Hooker
     */
    function isHooker(uint16 tokenId_) external view override returns (bool) {
        return candyMachine.isHooker(tokenId_);
    }

    /**
     * gets the notoriety score of a token, the more the index, the less the share
     * @param tokenId_ Pimp tokenID to get the notoriety score from
     * @return the notoriety score of the Pimp
     */
    function notorietyOfPimp(uint16 tokenId_)
        external
        view
        override
        returns (uint8)
    {
        return
            MAX_PIMP_NOTORIETY_SCORE -
            candyMachine.notorietyIndexOfToken(tokenId_);
    }

    /***RENDER */

    /** @notice thrown when trying to get the URI for a token which does not exist (eg, not minted) */
    error NonexistentToken();

    /**
     * Reimplementation of ERC721's tokenURI()
     * Generates a base64 encoded metadata response without referencing off-chain content
     * @param tokenId_ the ID of the token to generate the metadata for
     * @return a base64 encoded JSON dictionary of the token's metadata and SVG
     */
    function tokenURI(uint256 tokenId_)
        public
        view
        override
        returns (string memory)
    {
        //
        if(_exists(tokenId_) == false) revert("NonexistentToken");
    
        // casts to real max data type
        return candyMachine.tokenURI(uint16(tokenId_));
    }

    /**
     * Allows to generate SVG image and metadata on-the-fly of a given token
     * @dev un-optimized and fully on-chain method of token rendering, prefer tokenURI() if the official dApp is available
     */
    function otfTokenURI(uint256 tokenId_) public view returns (string memory) {
        //
        if(_exists(tokenId_) == false) revert("NonexistentToken");
        
        // casts to real max data type
        return candyMachine.otfTokenURI(uint16(tokenId_));
    }

    /***REIMPLEMENTATIONS */

    /** @notice thrown when the transferer is not approved nor owner */
    error CallerNotApproved();

    /**
     * Reimplementation of ERC721 transferFrom. Allows to transfer a token
     * @param from_ holder address
     * @param to_ recipient address
     * @param tokenId_ token to transfer
     */
    function transferFrom(
        address from_,
        address to_,
        uint256 tokenId_
    ) public override(ERC721, IERC721) {
        // RedLightDistrict is always approved
        // its saves gas on check approbation
        if (_msgSender() != address(redLightDistrict)) {
            if(_isApprovedOrOwner(_msgSender(), tokenId_) == false) revert("CallerNotApproved");
        }

        // transfert token !
        _transfer(from_, to_, tokenId_);
    }

    /**
     * ERC721 implementation of ownerOf
     * @param tokenId_ token to get owner from
     */
    function ownerOf(uint256 tokenId_)
        public
        view
        override(ERC721, IERC721)
        returns (address)
    {
        return ERC721.ownerOf(tokenId_);
    }

    /**
     * tells that this contract is compatible with both ERC721Enumerable and ERC721Royalty
     */
    function supportsInterface(bytes4 interfaceId_)
        public
        view
        virtual
        override(ERC721Enumerable, ERC721Royalty, IERC165)
        returns (bool)
    {
        return
            ERC721Enumerable.supportsInterface(interfaceId_) ||
            ERC721Royalty.supportsInterface(interfaceId_);
    }

    /**
     * prefer use of ERC721Royalty's implementation of '_burn'
     */
    function _burn(uint256 tokenId_)
        internal
        virtual
        override(ERC721, ERC721Royalty)
    {
        ERC721Royalty._burn(tokenId_);
    }

    /**
     * prefer use of ERC721Enumerable's implementation of '_beforeTokenTransfer'
     */
    function _beforeTokenTransfer(
        address from_,
        address to_,
        uint256 tokenId_
    ) internal override(ERC721, ERC721Enumerable) {
        ERC721Enumerable._beforeTokenTransfer(from_, to_, tokenId_);
    }

    ///
    function _isNextTokenScarce() internal view override returns (bool) {
        return _willTokenGetScarce(_nextToken());
    }

    ///
    function _willTokenGetScarce(uint16 tokenId_)
        internal
        view
        override
        returns (bool)
    {
        return tokenId_ > PAYABLE_TOKENS_SCARCE_AT && _isPayableToken(tokenId_);
    }
}
