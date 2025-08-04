// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";

import "./_/enum/Nightworker.sol";

import "./_/interface/IRedLightDistrict.sol";
import "./_/interface/ILOLLY.sol";

import "./_/abstract/base/TrustedValidatorLeaned.sol";
import "./_/abstract/base/AutomaticTransferer.sol";
import "./_/abstract/base/NightworkersInteractor.sol";

contract RedLightDistrict is
    IRedLightDistrict,
    NightworkersInteractor,
    IERC721Receiver,
    AutomaticTransferer,
    TrustedValidatorLeaned
{
    // struct to store a stake's token, owner, and earning values
    struct Stake {
        uint256 value; // could be a timestamp (for Hookers), or a latest LPN share (for Pimps)
        address owner;
    }

    // define all bailout options available
    enum SneakOption {
        MoneyOut,
        MoneyAndTokenOut,
        TokenOut
    }

    // reference to the $LOLLY contract for minting $LOLLY earnings
    ILOLLY private immutable _lolly;
    /// tax to apply on each token we wish to claim revenue from
    uint256 public constant SINGLE_TOKEN_CLAIM_TAX = .01 ether;

    // maps Token ID >> Stake
    mapping(uint16 => Stake) private _stakeByToken;
    // maps Owners >> Tokens IDs
    mapping(address => uint16[]) private _stakedTokens;
    // maps Tokens ID >> index in _stakedTokens array
    mapping(uint16 => uint16) private _stakedTokensIndex;

    // maps Notoriety >> Pimp Token IDs
    mapping(uint8 => uint16[]) private _famigliaRanks;
    // maps Pimp TokenID >> Index of Notoriety Group he is inside
    mapping(uint16 => uint16) private _pimpRankedAs;

    // total notoriety scores staked
    uint256 private _totalNotorietyStaked;
    /// any rewards distributed to pimps by hookers, when no pimps are staked
    uint256 public unaccountedRewards;
    // amount of $LOLLY due for each notoriety point staked
    uint256 private _lollyPerNotoriety;

    /// pimps take a 20 percent tax on all $LOLLY claimed
    uint256 public constant LOLLY_CLAIM_TAX_PERCENTAGE = 20;
    /// there will only ever be (roughly) 2.4 billion $LOLLY earned through staking
    uint256 public constant MAXIMUM_GLOBAL_LOLLY = 2_400_000_000 ether;
    /// how many maximum claims you can make at once when claiming / unstaking, prevents running out of gas
    uint8 public constant MAX_CLAIM_AT_ONCE = 30;
    /// how many maximum tokens you can put to work in a single tx, prevents running out of gas
    uint8 public constant MAX_EMPLOYABLE_AT_ONCE = 30;

    // How much a Hooker earns per second staked
    uint256 public SEC_LOLLY_RATE;
    /// minimum time in seconds a Hooker must wait after a successful claim / staking to be able to unstake
    uint32 public MINIMUM_TO_EXIT;

    /// is staking allowed ?
    bool public isStakingAllowed = false;

    /// amount of $LOLLY earned so far by Hookers
    uint256 public totalLollyEarned;
    /// total number of Hookers staked in the Red Light District
    uint16 public totalHookersStaked;
    /// total number of Pimps staked in the Red Light District
    uint16 public totalPimpsStaked;

    // the last time we updated global $LOLLY earnings by Hookers
    uint32 private _latestEarningsUpdateAt;
    /// kinda-precise timestamp for when the $LOLLY producing limit has been reached
    uint32 public LOLLYLimitReachedAt;

    // hooker claiming order ID
    uint32 private _uhr_nonce;

    receive() external payable {}

    fallback() external payable {}

    //
    constructor(
        address trustedValidator_,
        ILOLLY lolly_,
        address payable taxReceiver_,
        uint256 dailyLollyRate_,
        uint32 minimumToExitInSecs_
    ) AutomaticTransferer(taxReceiver_, 2 ether) {
        //
        _addTrustedValidator(trustedValidator_);

        //
        _lolly = lolly_;

        //
        _updateEconomySettings(dailyLollyRate_, minimumToExitInSecs_);

        // paused by default
        _pause();
    }

    /***STAKING */

    /**
     * OWNER ONLY
     * controls the ability to stake tokens
     * @param enabled_ should enable staking or not
     */
    function allowStaking(bool enabled_) external onlyOwner {
        isStakingAllowed = enabled_;
    }

    /** @notice thrown when staking has been explicitely disabled by the owner */
    error StakingDisabled();

    /** @notice thrown when trying to stake more tokens that the configured limit allows */
    error TooMuchTokensToWorkAtOnce();

    /** @notice thrown when trying to stake a token which is not yours, or that you have already staked */
    error NotOwningOrAlreadyStakedToken();

    /// when not puting to work from minting contract, we need to give ownership of these tokens to main game
    function putManyToWork(uint16[] calldata tokenIds_) external onlyEOA {
        if(isStakingAllowed == false) revert("StakingDisabled");
        if(tokenIds_.length > MAX_EMPLOYABLE_AT_ONCE) revert("TooMuchTokensToWorkAtOnce");

        //
        uint16 i_;

        // CHECK : Owns all tokens specified ?
        for (i_; i_ < tokenIds_.length; i_++) {
            if(_mGame.ownerOf(tokenIds_[i_]) != _msgSender()) revert("NotOwningOrAlreadyStakedToken");
        }

        // TRANSFER : give token to streets
        for (i_ = 0; i_ < tokenIds_.length; i_++) {
            if (tokenIds_[i_] == 0) continue;
            _mGame.transferFrom(_msgSender(), address(this), tokenIds_[i_]);
        }

        // once tokens are owned by RLD, put them to work
        _putManyToWork(_msgSender(), tokenIds_);
    }

    /** */
    event TokenStaked(uint16 indexed tokenId, address indexed staker);

    /**
     * Puts Hookers and Pimps into the cruel world of Red Light District
     * @dev tokenIds_ can contains 0s, means that the minted token at this index has been stolen
     * @dev optimized for efficient branch predicting and storage usage
     * @param account_ the address of the staker
     * @param tokenIds_ the IDs of the tokens that must be staked, can be empty if token is stolen from a previous automatic minting operation
     */
    function _putManyToWork(address account_, uint16[] calldata tokenIds_)
        private
        _updateEarnings
    {
        // prepare
        uint16 i_;
        uint16 tokenId_;

        //
        // REGISTER : register all tokens as staked (standard)
        //
        for (i_; i_ < tokenIds_.length; i_++) {
            tokenId_ = tokenIds_[i_];
            if (tokenId_ == 0) continue;

            //
            _stakedTokens[account_].push(tokenId_);

            //
            _stakedTokensIndex[tokenId_] = uint16(
                _stakedTokens[account_].length - 1
            );

            // define new owner
            _stakeByToken[tokenId_].owner = account_;

            // make the world know
            emit TokenStaked(tokenId_, account_);
        }

        //
        // REGISTER : register all tokens as staked (specialized)
        //

        // SPLIT : tokens IDs into 2 arrays, 1 by token type
        (
            uint16[] memory hookers,
            uint16[] memory pimps,
            uint16 hookersCount,
            uint16 pimpsCount
        ) = _splitTokensArrayByType(tokenIds_);

        //
        // Hookers...
        //

        if(hookersCount > 0) {
            //
            for (i_ = 0; i_ < hookers.length; i_++) {
                // define block timestamp as stake
                _stakeByToken[hookers[i_]].value = uint32(block.timestamp);
            }

            // increase the pool
            totalHookersStaked += hookersCount;
        }


        //
        // Pimps...
        //

        if(pimpsCount > 0) {
            //
            uint8 notoriety_;
            uint256 notorietyToStakeSum_;

            //
            for (i_ = 0; i_ < pimps.length; i_++) {
                tokenId_ = pimps[i_];

                // gets notoriety of said Pimp, more means stronger
                notoriety_ = _mGame.notorietyOfPimp(tokenId_);

                // adds to total notoriety
                notorietyToStakeSum_ += notoriety_;

                // Store the location of the pimp in the Famiglia
                _famigliaRanks[notoriety_].push(tokenId_);

                // define at which index of his notoriety group this token is located
                _pimpRankedAs[tokenId_] = _getLatestPimpIndexFromGroup(notoriety_);

                // define stake as share part
                _stakeByToken[tokenId_].value = _lollyPerNotoriety;
            }

            // increase the pools
            totalPimpsStaked += pimpsCount;
            _totalNotorietyStaked += notorietyToStakeSum_;

            // make sure to ack for unaccountedRewards
            _updateLOLLYPerNotorietyRate(0);
        }
    }

    /***CLAIMING / UNSTAKING */

    /// wrapper of sneakOutMany, for unstaking tokens without claiming
    function rescueMany(
        uint16[] calldata tokenIds_,
        TrustfulOrderPayload calldata payload_
    ) external payable {
        sneakOutMany(tokenIds_, SneakOption.TokenOut, payload_);
    }

    /// wrapper of sneakOutMany, for claiming token rewards
    function claimMany(
        uint16[] calldata tokenIds_,
        TrustfulOrderPayload calldata payload_
    ) external payable {
        sneakOutMany(tokenIds_, SneakOption.MoneyOut, payload_);
    }

    /// wrapper of sneakOutMany, to claim rewards and unstake tokens
    function unstakeMany(
        uint16[] calldata tokenIds_,
        TrustfulOrderPayload calldata payload_
    ) external payable {
        sneakOutMany(tokenIds_, SneakOption.MoneyAndTokenOut, payload_);
    }

    /// gets the tax we need to pay to claim
    function getClaimTax(uint256 howManyTokens_) public pure returns (uint256) {
        return SINGLE_TOKEN_CLAIM_TAX * howManyTokens_;
    }

    /** @notice thrown when trying to sneak out with much more token than configured */
    error TooMuchTokensSneakingAtOnce();

    /** @notice thrown when trying to sneak out a token which is not yours, or which is not staked */
    error NotOwningOrNotStakedToken();

    /** @notice thrown when an invalid (relative to the sneaking option context) tax amount is provided */
    error InvalidClaimTaxAmount();

    /**
     * Optionally realize $LOLLY earnings AND / OR unstake tokens from the Red Light District
     * to unstake a Hooker it will require at least 2 days being on the streets without claiming anything
     * you need to yield a small tax for each token you claim $LOLLY for !
     * you cannot sneak out more than MAX_CLAIM_AT_ONCE() tokens at once
     * @dev optimized for efficient branch predicting and storage usage
     * @dev default pause let the contract owner pass liquidity to the $LOLLY pool before enabling claim
     * @param tokenIds_ the IDs of the tokens you want to play with
     * @param option_ determine what kind of action you wish to make regarding your tokens
     */
    function sneakOutMany(
        uint16[] calldata tokenIds_,
        SneakOption option_,
        TrustfulOrderPayload calldata payload_
    ) public payable whenNotPaused _updateEarnings onlyEOA {
        if(tokenIds_.length > MAX_CLAIM_AT_ONCE) revert("TooMuchTokensSneakingAtOnce");

        // get tokens associated states and check that caller owns them
        for (uint16 i_; i_ < tokenIds_.length; i_++) {
            if(_stakeByToken[tokenIds_[i_]].owner != _msgSender()) revert("NotOwningOrNotStakedToken");
        }

        // calculate tax to pay, prevent sending blockchain currency if not needed
        uint256 taxToPay_;
        if (_wantsMoney(option_)) {
            // only pay tax if unstaking
            taxToPay_ = getClaimTax(tokenIds_.length);
        }

        //
        if(msg.value != taxToPay_) revert("InvalidClaimTaxAmount");

        // prepare context
        SneakOutContext memory tmp_;
        tmp_.sneaker = _msgSender();
        tmp_.isUnstaking = _wantsUnstaking(option_);
        tmp_.wantsMoney = _wantsMoney(option_);

        // sneak out !
        _sneakOutMany(tmp_, tokenIds_, payload_);

        //
        _mayAutomaticallyTransfer();
    }

    /**
     * need a struct to circumvent "stack too deep"
     * @dev ordered to limit memory gaps
     */
    struct SneakOutContext {
        uint256 totalOwed;
        uint256 owed;
        uint256 pimpLoot;
        address sneaker;
        bool isUnstaking;
        bool wantsMoney;
        uint16 hookersCount;
        uint16 pimpsCount;
        uint16 latestTokenIdToSwap;
        uint16 pimpRank;
        uint16[] hookers;
        uint16[] pimps;
        uint8[] pimpNotoriety;
    }

    /**
     *
     */
    function _splitTokensArrayByType(uint16[] calldata tokenIds_)
        private
        view
        returns (
            uint16[] memory hookers_,
            uint16[] memory pimps_,
            uint16 hookersCount_,
            uint16 pimpsCount_
        )
    {
        //
        bool[] memory isHookerRepartition_ = new bool[](tokenIds_.length);

        // SPLIT : know which token is hooker or pimp
        uint16 i_;
        for (i_; i_ < tokenIds_.length; i_++) {
            if (_mGame.isHooker(tokenIds_[i_])) {
                isHookerRepartition_[i_] = true;
                hookersCount_++;
            } else {
                pimpsCount_++;
            }
        }

        //
        hookers_ = new uint16[](hookersCount_);
        pimps_ = new uint16[](pimpsCount_);

        // SPLIT : tokens IDs into 2 arrays, 1 by token type
        uint16 pimpIndex_;
        uint16 hookerIndex_;
        for (i_ = 0; i_ < tokenIds_.length; i_++) {
            if (isHookerRepartition_[i_]) {
                hookers_[hookerIndex_++] = tokenIds_[i_];
            } else {
                pimps_[pimpIndex_++] = tokenIds_[i_];
            }
        }
    }

    /*
     * For Hooker : get timestamp at which an hooker has claimed for the last time
     * For Pimp : get the token's share of all Pimps loot
     */
    function stakeDataOf(uint16 tokenId_) external view returns (uint256) {
        return _stakeByToken[tokenId_].value;
    }

    //
    function _hookerCurrentWorktimeInSecs(uint16 hookerId_)
        private
        view
        returns (uint256)
    {
        return block.timestamp - _stakeByToken[hookerId_].value;
    }

    /** @notice thrown when a hooker you are trying to unstake is still in her configured vesting period*/
    error HookerStillVesting();

    /** */
    event TokenClaimed(
        uint16 indexed tokenId,
        address indexed claimer,
        uint256 earned,
        bool unstaked
    );

    /** */
    event UnstakingHookersRewards(
        uint32 indexed uhr_nonce,
        address indexed unstaker,
        uint16[] hookersIds,
        uint256[] owedAmounts
    );

    /**
     * @dev optimized for branch-prediction efficiency, abuses of duplicated for-loops
     */
    function _sneakOutMany(
        SneakOutContext memory tmp_,
        uint16[] calldata tokenIds_,
        TrustfulOrderPayload calldata payload_
    ) private trustedValidatorOrder(payload_) {
        // prepare pointers, temporary variables...
        uint16 i_;

        // SPLIT : tokens IDs into 2 arrays, 1 by token type
        (
            tmp_.hookers,
            tmp_.pimps,
            tmp_.hookersCount,
            tmp_.pimpsCount
        ) = _splitTokensArrayByType(tokenIds_);

        // CHECK : For unstaking Hookers (and NOT rescuing), check that they are not trying to leave too soon
        if (tmp_.isUnstaking && tmp_.wantsMoney) {
            for (i_; i_ < tmp_.hookers.length; i_++) {
                if(_hookerCurrentWorktimeInSecs(tmp_.hookers[i_]) < MINIMUM_TO_EXIT) revert("HookerStillVesting");
            }
        }

        // FETCH : if any, get all pimp notorieties
        if (tmp_.pimpsCount > 0) {
            // create array
            tmp_.pimpNotoriety = new uint8[](tmp_.pimpsCount);

            // set notorieties
            for (i_ = 0; i_ < tmp_.pimps.length; i_++) {
                tmp_.pimpNotoriety[i_] = _mGame.notorietyOfPimp(tmp_.pimps[i_]);
            }
        }

        //
        // LET'S GET THE WORK DONE
        //

        // wants money ?
        if (tmp_.wantsMoney) {
            //
            // Hookers...
            //

            if (tmp_.hookersCount > 0) {
                //
                // FETCH : compute how many $LOLLY every hooker made
                //

                //
                uint256[] memory owedToHookers_ = new uint256[](
                    tmp_.hookersCount
                );

                //
                for (i_ = 0; i_ < tmp_.hookers.length; i_++) {
                    owedToHookers_[i_] = _computeHookerReward(
                        _stakeByToken[tmp_.hookers[i_]], // hooker's stake
                        block.timestamp // current timestamp
                    );
                }

                // if unstaking...
                if (tmp_.isUnstaking) {
                    //
                    // since unstaking hookers have a random chance of owed amount stolen, delegate that call into a bulk package
                    //

                    _uhr_nonce++; // increment order id
                    emit UnstakingHookersRewards(
                        _uhr_nonce,
                        tmp_.sneaker,
                        tmp_.hookers,
                        owedToHookers_
                    ); // emit
                    _traceTrustfulOrder(
                        TrustedPurpose.UnstakingHookers,
                        _uhr_nonce,
                        payload_
                    ); // requests random number
                }
                // only claiming...
                else {
                    // for each hooker
                    for (i_ = 0; i_ < tmp_.hookers.length; i_++) {
                        //
                        tmp_.owed = owedToHookers_[i_];

                        // if nothing owed, skip
                        if (tmp_.owed == 0) {
                            continue;
                        }

                        // You know you have to pay your percentage tax to staked pimps
                        tmp_.pimpLoot +=
                            (tmp_.owed * LOLLY_CLAIM_TAX_PERCENTAGE) /
                            100;

                        // remainder goes to hooker owner, you earned it girl
                        tmp_.owed =
                            (tmp_.owed * (100 - LOLLY_CLAIM_TAX_PERCENTAGE)) /
                            100;

                        // adds to the total owed
                        tmp_.totalOwed += tmp_.owed;

                        // makes the world know
                        emit TokenClaimed(
                            tmp_.hookers[i_],
                            tmp_.sneaker,
                            tmp_.owed,
                            tmp_.isUnstaking
                        );
                    }
                }
            }

            //
            // Pimps...
            //

            // make sure to ack for unaccountedRewards into the rate BEFORE including any hookers tax into the rate
            if (tmp_.pimpsCount > 0) {
            _updateLOLLYPerNotorietyRate(0);
            }

            //
            for (i_ = 0; i_ < tmp_.pimps.length; i_++) {
                // compute this Pimp's reward
                tmp_.owed = _computePimpReward(
                    _stakeByToken[tmp_.pimps[i_]], // Pimp's stake
                    tmp_.pimpNotoriety[i_] // pimp's notoriety
                );

                // adds to the total owed
                tmp_.totalOwed += tmp_.owed;

                // makes the world know
                emit TokenClaimed(
                    tmp_.pimps[i_],
                    tmp_.sneaker,
                    tmp_.owed,
                    tmp_.isUnstaking
                );
            }

            //
            // COMPUTE TAX, make sure to update LOLLYPerNotoriety rate if paying tax
            //

            if (tmp_.pimpLoot > 0) {
                // if any pimp loot, give it to the famiglia for the next pimps to claim it
                _updateLOLLYPerNotorietyRate(tmp_.pimpLoot);
            }
        }

        // Only wants money out ? (no need to update stakes if unstaking)
        if (tmp_.wantsMoney && !tmp_.isUnstaking) {
            //
            // reset stakes !
            //

            // Hookers...
            for (i_ = 0; i_ < tmp_.hookers.length; i_++) {
                _stakeByToken[tmp_.hookers[i_]].value = uint32(block.timestamp);
            }

            // Pimps...
            for (i_ = 0; i_ < tmp_.pimps.length; i_++) {
                _stakeByToken[tmp_.pimps[i_]].value = _lollyPerNotoriety;
            }
        }

        // wants unstaking ?
        if (tmp_.isUnstaking) {
            //
            // RESET : reset specific unstaking states by token type
            //

            // Hookers...
            if(tmp_.hookersCount > 0) {
                totalHookersStaked -= tmp_.hookersCount;
            }


            // Pimps...
            if(tmp_.pimpsCount > 0) {
                //
                uint256 notorietyToUnstakeSum_;
                uint8 tmpNotoriety_;

                //
                for (i_ = 0; i_ < tmp_.pimps.length; i_++) {
                    // get interesting values of Pimp
                    tmpNotoriety_ = tmp_.pimpNotoriety[i_];
                    tmp_.pimpRank = _pimpRankedAs[tmp_.pimps[i_]];

                    // Remove Notoriety from total staked
                    notorietyToUnstakeSum_ += tmpNotoriety_;

                    // get latest staked Pimp in this notoriety group
                    tmp_.latestTokenIdToSwap = _famigliaRanks[tmpNotoriety_][
                        _getLatestPimpIndexFromGroup(tmpNotoriety_)
                    ];

                    // Swap lastest staked Pimp with this unstaking Pimp
                    _famigliaRanks[tmpNotoriety_][tmp_.pimpRank] = tmp_
                        .latestTokenIdToSwap;
                    _pimpRankedAs[tmp_.latestTokenIdToSwap] = tmp_.pimpRank; // takes unstaked Pimp rank

                    // Remove latest, since he is located elsewhere now
                    _famigliaRanks[tmpNotoriety_].pop();

                    // Reset rank of unstaking pimp
                    delete _pimpRankedAs[tmp_.pimps[i_]];
                }

                // decrease the pools
                totalPimpsStaked -= tmp_.pimpsCount;
                _totalNotorietyStaked -= notorietyToUnstakeSum_;
            }

            //
            // TRANSFER : send back tokens to owner and unstake
            //

            // loop through supplied tokens
            uint256 lastIndex_;
            uint256 indexToRemove_;
            for (i_ = 0; i_ < tokenIds_.length; i_++) {
                // send back token to owner
                _mGame.transferFrom(address(this), tmp_.sneaker, tokenIds_[i_]);

                // get IDs that might be swaped
                lastIndex_ = _stakedTokens[tmp_.sneaker].length - 1;

                indexToRemove_ = _stakedTokensIndex[tokenIds_[i_]];

                // if indexes are not the same, swap needed
                if (lastIndex_ != indexToRemove_) {
                    //
                    tmp_.latestTokenIdToSwap = _stakedTokens[tmp_.sneaker][
                        lastIndex_
                    ];

                    // swap tokenIDs !
                    (
                        _stakedTokens[tmp_.sneaker][indexToRemove_],
                        _stakedTokens[tmp_.sneaker][lastIndex_]
                    ) = (
                        _stakedTokens[tmp_.sneaker][lastIndex_],
                        _stakedTokens[tmp_.sneaker][indexToRemove_]
                    );

                    // swap indexes !
                    (
                        _stakedTokensIndex[tokenIds_[i_]],
                        _stakedTokensIndex[tmp_.latestTokenIdToSwap]
                    ) = (
                        _stakedTokensIndex[tmp_.latestTokenIdToSwap],
                        _stakedTokensIndex[tokenIds_[i_]]
                    );
                }

                // reset storage index of said token
                delete _stakedTokensIndex[tokenIds_[i_]];

                // pop last token ID from the array of user's staked tokens, since he is positioned as last
                _stakedTokens[tmp_.sneaker].pop();

                // remove stake information
                delete _stakeByToken[tokenIds_[i_]];
            }
        }

        //
        // MINT : give $LOLLY to sender
        //

        // mint if owed $LOLLY
        if (tmp_.totalOwed != 0) {
            _lolly.mint(tmp_.sneaker, tmp_.totalOwed);
        }
    }

    /** */
    event UnstakedHookersRewards(
        uint32 indexed uhr_nonce,
        uint256 initiallyOwed,
        uint256[] givenAmounts
    );

    /**
     * @dev any owedAmount after 32th is stoken
     */
    function processHookersUnstakingRewards(
        uint32 uhr_nonce_,
        address unstaker_,
        uint256[] calldata owedAmounts_,
        TrustfulResponsePayload calldata payload_
    ) external trustedValidatorOnly(payload_) {
        // prepare...
        uint256[] memory givenAmounts_ = new uint256[](owedAmounts_.length);
        uint256 totalOwed_;
        uint256 totalStolen_;

        {
            // for each hooker owed amount...
            bool isStolen_;
            uint256 owedAmount_;
            for (uint256 i_; i_ < owedAmounts_.length; i_++) {
                // try each bit by owedAmount (coinflip-like, 50% chance)
                // - if bit is 0, then amount is stolen
                // - if bit is 1, then amount is given
                isStolen_ = (payload_.randomNumber >> i_) & 1 == 0;

                // distribute...
                owedAmount_ = owedAmounts_[i_];
                if (isStolen_) {
                    totalStolen_ += owedAmount_;
                } else {
                    givenAmounts_[i_] = owedAmount_;
                    totalOwed_ += owedAmount_;
                }
            }
        }

        // give all that is stoken
        if (totalStolen_ > 0) {
            _updateLOLLYPerNotorietyRate(totalStolen_);
        }

        // gives all that is owed
        if (totalOwed_ > 0) {
            _lolly.mint(unstaker_, totalOwed_);
        }

        //
        // EMIT
        //

        emit UnstakedHookersRewards(uhr_nonce_, totalOwed_ + totalStolen_, givenAmounts_);
        _traceTrustfulResponse(
            TrustedPurpose.UnstakingHookers,
            uhr_nonce_,
            payload_
        );
    }

    /**
     *
     */
    function _wantsUnstaking(SneakOption option_) private pure returns (bool) {
        return
            option_ == SneakOption.MoneyAndTokenOut ||
            option_ == SneakOption.TokenOut;
    }

    /**
     *
     */
    function _wantsMoney(SneakOption option_) private pure returns (bool) {
        return
            option_ == SneakOption.MoneyAndTokenOut ||
            option_ == SneakOption.MoneyOut;
    }

    /**
     * gets how many staked tokens there are in this specific notoriety score group
     * cannot go higher than the max tokenID
     */
    function _getFamigliaGroupMembersCount(uint8 notorietyScore_)
        private
        view
        returns (uint16)
    {
        return uint16(_famigliaRanks[notorietyScore_].length);
    }

    function _getLatestPimpIndexFromGroup(uint8 notorietyScore_)
        private
        view
        returns (uint16)
    {
        return _getFamigliaGroupMembersCount(notorietyScore_) - 1;
    }

    /***ACCOUNTING */

    /**
     * add $LOLLY to claimable pot for the Famiglia
     * @param taxAmount_ $LOLLY to add to the pot, can be 0 in case of a simple update wanted
     */
    function _updateLOLLYPerNotorietyRate(uint256 taxAmount_) private {
        // makes sure to include any unaccounted $LOLLY
        uint256 unaccountedRewards_ = unaccountedRewards;

        // if nothing changes that allows an update, skip
        if (taxAmount_ == 0 && unaccountedRewards_ == 0) {
          return;
        }

        // no staked pimp there yet ?
        uint256 totalNotorietyStaked_ = _totalNotorietyStaked;
        if (totalNotorietyStaked_ == 0) {
            // it's OK, keep track of $LOLLY due to pimps
            unaccountedRewards += taxAmount_;

            // we'll get the money next time...
            return;
        }

        // update
        _lollyPerNotoriety +=
            (taxAmount_ + unaccountedRewards_) /
            totalNotorietyStaked_;

        // resets unaccounted rewards as it has been acknoledged
        if (unaccountedRewards_ != 0) {
            unaccountedRewards = 0;
        }
    }

    // #if DEBUG

    /**
     * @dev pass as 'internal' to allow debuging with 'hardhat-exposed'
     */
    function _forceUpdateEarnings() internal _updateEarnings {}

    // #endif

    /**
     * tracks total Hookers $LOLLY earnings to ensure it stops once 2.4 billion is reached
     */
    modifier _updateEarnings() {
        // while total $LOLLY earned does not meet limit
        if (LOLLYLimitReachedAt == 0) {           
            // get how many is currently produced by all the hookers staked
            uint256 producedPerSecond_ = totalHookersStaked * SEC_LOLLY_RATE;

            // compute earnings by comparing current time to previously updated time
            uint256 projected_ = totalLollyEarned + (block.timestamp - _latestEarningsUpdateAt) * producedPerSecond_;

            // if we overshoot limit...
            if (projected_ > MAXIMUM_GLOBAL_LOLLY) {
                // tells that the limit has been reached at, at most, current timestamp
                LOLLYLimitReachedAt = uint32(
                    block.timestamp -
                    // Try to find how much seconds back in time the limit has been reached at.
                    // @dev Allows to earn globally a little bit more than limit for each hooker staked remaining. Better more than less :D
                   (MAXIMUM_GLOBAL_LOLLY - projected_) % producedPerSecond_
                );
            } 
            
            // if not, just stacks up
            else {
                totalLollyEarned = projected_;
            }

            // update timestamp of latest computation
            _latestEarningsUpdateAt = uint32(block.timestamp);
        }

        //
        _;
    }

    /***ADMIN */

    /** */
    event EconomyChanged(uint256 dailyLollyRate, uint32 minimumToExitInSecs);

    /**
     * OWNER ONLY
     * Updates economy settings
     * @param dailyLollyRate_ rate at which a single hooker produces LOLLY per day
     * @param minimumToExitInSecs_ minimum time to unstake with LOLLY for hooker from last time staking / claiming
     */
    function updateEconomySettings(uint256 dailyLollyRate_, uint32 minimumToExitInSecs_)
        public
        onlyOwner
    {
        //
        _updateEconomySettings(dailyLollyRate_, minimumToExitInSecs_);

        //
        emit EconomyChanged(dailyLollyRate_, minimumToExitInSecs_);
    }

    /** @notice */
    error InvalidEconomySettings();

    /**
     *
     */
    function _updateEconomySettings(uint256 dailyLollyRate_, uint32 minimumToExitInSecs_)
        private
    {
        if(dailyLollyRate_ < 1_000 ether || minimumToExitInSecs_ == 0 || minimumToExitInSecs_ > 30 days) revert("InvalidEconomySettings");

        //
        MINIMUM_TO_EXIT = minimumToExitInSecs_;
        SEC_LOLLY_RATE = dailyLollyRate_ / 1 days;
    }

    /***READ ONLY */

    /**
     * retrives the number of staked tokens of an address
     * @dev ERC721 compliant
     */
    function balanceOf(address owner_) external view returns (uint256) {
        return _stakedTokens[owner_].length;
    }

    /**
     * get the staked token ID at the given index
     * @dev ERC721 compliant
     */
    function tokenOfOwnerByIndex(address owner_, uint256 index_)
        external
        view
        returns (uint256)
    {
        return _stakedTokens[owner_][index_];
    }

    function LOLLYPerNotoriety() external view returns (uint256) {
        return _lollyPerNotoriety;
    }

    /**
     * return the pimp reward at time
     */
    function _computePimpReward(Stake storage pimpStake_, uint8 pimpNotoriety_)
        private
        view
        returns (uint256)
    {
        return pimpNotoriety_ * (_lollyPerNotoriety - pimpStake_.value);
    }

    /**
     * Estimate hooker's reward, without Pimp tax accounted
     * epochCurrentTimeSec_ is optional
     * @param hookerStake_ hooker stake to check rewards from
     * @param epochCurrentTimeSec_ date to which we can compare upon, in epoch seconds. Most usually block.timestamp
     */
    function _computeHookerReward(
        Stake storage hookerStake_,
        uint256 epochCurrentTimeSec_
    ) private view returns (uint256) {
        //
        uint32 latestClaimTs_ = uint32(hookerStake_.value);

        /* for safety, checks that latest claim was not done after current timestamp nor after latest earnings */
        if (latestClaimTs_ >= _latestEarningsUpdateAt || latestClaimTs_ >= epochCurrentTimeSec_) {
            return 0;
        }

        //
        uint32 secondsToAck_;
        uint32 LOLLYLimitReachedAt_ = LOLLYLimitReachedAt;

        // if limit not reached...
        if (LOLLYLimitReachedAt_ == 0) {
            // get seconds between latest claim and current block timestamp
            secondsToAck_ = uint32(epochCurrentTimeSec_) - latestClaimTs_;
        } 
        
        // if limit has been reached AND happened after last claim...
        else if (LOLLYLimitReachedAt_ > latestClaimTs_) {
            // get seconds between latest claim and when limit was reached
            secondsToAck_ = LOLLYLimitReachedAt_ - latestClaimTs_;
        } 


        // compute how many $LOLLY you made
        return SEC_LOLLY_RATE * secondsToAck_;
    }

    /**
     * chooses a random Pimp to be the new owner of a
     * @dev see "doc/StealingPimp.xlsx" for repartition explaination
     * @param seed_ a random value to choose a Pimp from
     * @param minterToBeStoken_ address from which originated the mint order
     * @return ultimateRecipient_ the definitive owner, can be minterToBeStoken_
     * @return stealerId_ the token id of the randomly selected Pimp, if any has been picked
     */
    function mayPickStealerPimp(address minterToBeStoken_, uint256 seed_)
        external
        view
        override
        onlyMintingGame
        returns (address ultimateRecipient_, uint16 stealerId_)
    {
        // cannot pick a random pimp owner if none have been staked already !
        if (_totalNotorietyStaked == 0) {
            return (minterToBeStoken_, 0);
        }

        // choose a value from 0 to total notoriety staked
        uint256 bucket_ = (seed_ & 0xFFFFFFFF) % _totalNotorietyStaked;
        seed_ >>= 32;

        // loop through each bucket of Pimps with the same notoriety score
        uint256 cumulative_;
        uint256 famigliaMembersCount_;
        for (
            uint8 notorietyGroup_ = _mGame.MIN_PIMP_NOTORIETY_SCORE();
            notorietyGroup_ <= _mGame.MAX_PIMP_NOTORIETY_SCORE();
            notorietyGroup_++
        ) {
            // cannot pick a stealer from an empty group !
            famigliaMembersCount_ = _getFamigliaGroupMembersCount(
                notorietyGroup_
            );
            if (famigliaMembersCount_ == 0) continue;

            // adds the cumulated notoriety score of all Pimps staked of this specific score
            cumulative_ += famigliaMembersCount_ * notorietyGroup_;

            // if the value is not inside of that bucket, keep looking
            if (cumulative_ < bucket_) continue;

            // get the address of the owner of a random Pimp with that notoriety score
            uint16 pickedPimpTokenId_ = _famigliaRanks[notorietyGroup_][
                seed_ % famigliaMembersCount_
            ];

            //
            return (
                _stakeByToken[pickedPimpTokenId_].owner,
                pickedPimpTokenId_
            );
        }

        // well, should not happen, but if we cannot find an appropriate new owner, just give it back to sender
        return (minterToBeStoken_, 0);
    }

    /** @notice thrown when trying to give tokens back to contract by using ERC721 standards directly */
    error CannotOwnTokensThisWay();

    /**
     * Rehandling of onERC721Received event, prevents this contract to receive tokens
     * @param from_ token sender address
     * @return selector
     */
    function onERC721Received(
        address,
        address from_,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        if(from_ != address(0)) revert("CannotOwnTokensThisWay");
        return IERC721Receiver.onERC721Received.selector;
    }
}
