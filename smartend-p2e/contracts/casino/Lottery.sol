// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "../_/abstract/casino/CasinoGame.sol";

contract Lottery is CasinoGame {
    //
    enum LotteryState {
        Ongoing,
        WaitingPricesDistribution,
        PricesDistributed
    }

    //
    struct LotteryRules {
        /// single ticket ether cost
        uint256 ticketCost;
        /// lottery duration
        uint32 lotteryDurationInSecs;
        /// maximum number of winners picked
        uint8 maximumWinners;
        /// must pick a new winner every X amount of partakers
        uint8 newWinnerEveryXPartakers;
    }

    //
    struct LotteryInformations {
        LotteryState state;
        // cumulated amount of ether all partakers participated into
        uint256 poolPrize;
        uint32 totalBoughtTickets;
    }

    //
    struct LotteryDuration {
        /// epoch second timestamp
        uint32 startsAt;
        /// epoch second timestamp
        uint32 finishesAt;
    }

    //
    struct LotterySet {
        uint16 id;
        LotteryDuration duration;
        LotteryInformations infos;
        LotteryRules rules;
        // array of unique partakers of this set
        address[] uniquePartakers;
    }

    //
    struct TicketsBuyTracker {
        // latest "Lottery Set ID" tickets have been bought for
        uint16 llsid;
        // how many tickets bought for a specific "Lottery Set ID"
        uint32 howMany;
    }

    // current lottery set
    LotterySet private _currentSet;
    // number of tickets bought by EOAs in the current lottery
    mapping(address => TicketsBuyTracker) private _ticketsBought;
    // tracks the latest buyer of ticket, to use its trustful payload when picking a winner
    IdentifiedTrustfuOrderPayload private _latestTicketsOrder;

    /// rules to be applied for the newly created lottery
    LotteryRules public nextRuleset;

    //
    constructor(address trustedValidator_, address payable taxReceiver_)
        CasinoGame(trustedValidator_, taxReceiver_, 900)
    {
        // default lottery rules
        _defineNextRuleset(
            LotteryRules({
                ticketCost: .05 ether,
                lotteryDurationInSecs: 2 days,
                maximumWinners: 10,
                newWinnerEveryXPartakers: 10
            })
        );

        // defaults current lottery with prices already distributed, to allow unpausing
        _currentSet.infos.state = LotteryState.PricesDistributed;

        // paused by default
        _pause();
    }

    //
    // PUBLIC VIEW
    //

    //
    function currentLotteryId() external view returns (uint16) {
        return _currentSet.id;
    }

    //
    function currentLotteryRules() external view returns (LotteryRules memory) {
        return _currentSet.rules;
    }

    //
    function currentLotteryInformations()
        external
        view
        returns (LotteryInformations memory)
    {
        return _currentSet.infos;
    }

    //
    function currentLotteryDuration()
        external
        view
        returns (LotteryDuration memory)
    {
        return _currentSet.duration;
    }

    //
    function howManyTicketsBoughtByMe() external view returns (uint32) {
        //
        TicketsBuyTracker storage myTicketsBought_ = _ticketsBought[
            _msgSender()
        ];

        //
        return
            myTicketsBought_.llsid == _currentSet.id
                ? myTicketsBought_.howMany
                : 0;
    }

    /// gets the rewards that are expected to be distributed if the lottery ended right now
    function currentRewards()
        external
        view
        returns (uint8 howManyWinners_, uint256 taxedRewardPerWinner_)
    {
        //
        howManyWinners_ = _howManyWinners();

        //
        taxedRewardPerWinner_ = howManyWinners_ != 0
            ? _getTaxedRewardOfMany(
                howManyWinners_,
                _currentSet.infos.poolPrize
            )
            : 0;
    }

    //
    // USER PAYABLE
    //

    /** @notice thrown when trying to buy too much tickets */
    error BuyingTooMuchTickets();

    /** @notice thrown when incorrect expected price for tickets is given */
    error IncorrectTicketsPrice();

    /** */
    event TicketsBought(
        uint16 indexed setId,
        address indexed buyer,
        uint16 numberOfTickets
    );

    /**
     * Allows anyone holding $LOLLY to buy tickets while a lottery is active. 255 at once.
     */
    function buyTickets(TrustfulOrderPayload calldata payload_)
        external
        payable
        whenNotPaused
        onlyEOA
        trustedValidatorOrder(payload_)
    {
        //
        uint256 ticketCost_ = _currentSet.rules.ticketCost;
        if (msg.value == 0 || msg.value % ticketCost_ != 0)
            revert("IncorrectTicketsPrice");
        if (msg.value / ticketCost_ >= 255) revert("BuyingTooMuchTickets");

        //
        uint8 howMany_ = uint8(msg.value / ticketCost_);

        //
        TicketsBuyTracker storage myTicketsBought_ = _ticketsBought[
            _msgSender()
        ];

        //
        uint16 currentSetId_ = _currentSet.id;
        bool hasAlreadyBoughtThisSet_ = myTicketsBought_.llsid == currentSetId_;

        // if buyer has already bought for the current set...
        if (hasAlreadyBoughtThisSet_) {
            // ... just update count
            myTicketsBought_.howMany += howMany_;
        }
        // if not ...
        else {
            // ... push as unique partaker ...
            _currentSet.uniquePartakers.push(_msgSender());

            // ... update current set ...
            myTicketsBought_.llsid = currentSetId_;

            // ... and reset ticket count
            myTicketsBought_.howMany = howMany_;
        }

        // update total bought tickets
        _currentSet.infos.totalBoughtTickets += howMany_;

        // update lottery pool
        _currentSet.infos.poolPrize += msg.value;

        // tell everybody you bought tickets
        emit TicketsBought(_currentSet.id, _msgSender(), howMany_);
        _latestTicketsOrder = IdentifiedTrustfuOrderPayload(
            _msgSender(),
            payload_
        );

        // check if we need to end lottery
        if (!_isAwaitingLastBuyerToClose()) return;

        // else, means that we can end current lottery
        _doPauseLottery(true);
    }

    /// checks lottery open state with timestamp comparaisons
    function isAwaitingLastBuyerToClose() external view returns (bool) {
        return _isAwaitingLastBuyerToClose() && !paused();
    }

    //
    // OWNER
    //

    /** @dev since Withdrawable.doPause used in "_doPauseLottery()" has "onlyOwner" modifier, no need to replicate */
    function doPause() public override {
        _doPauseLottery(false);
    }

    /** @dev since Withdrawable.doUnpause has "onlyOwner" modifier, no need to replicate */
    function doUnpause() public override {
        super.doUnpause();
        _mayStartNewLottery();
    }

    /** */
    function defineNextRuleset(
        uint256 ticketCost_,
        uint32 lotteryDurationInSecs_,
        uint8 maximumWinners_,
        uint8 newWinnerEveryXPartakers_
    ) external onlyOwner {
        //
        _defineNextRuleset(
            LotteryRules({
                ticketCost: ticketCost_,
                lotteryDurationInSecs: lotteryDurationInSecs_,
                maximumWinners: maximumWinners_,
                newWinnerEveryXPartakers: newWinnerEveryXPartakers_
            })
        );
    }

    /** @notice */
    error InvalidRuleset();

    /// define the next ruleset to apply for the next lottery
    function _defineNextRuleset(LotteryRules memory rules_) private {
        //
        if (
            rules_.lotteryDurationInSecs < 12 hours ||
            rules_.ticketCost == 0 ||
            rules_.newWinnerEveryXPartakers == 0 ||
            rules_.maximumWinners == 0
        ) {
            revert("InvalidRuleset");
        }

        //
        nextRuleset = rules_;
    }

    //
    // VALIDATION BOT
    //

    /**
     * actively try to end lottery by trying to pick winners and giving them the funds
     * @dev requires lottery to be paused to prevent movements on tickets
     */
    function distributePrices(
        bool mustRearmAfterPick_,
        TrustfulResponsePayload calldata payload_
    ) external trustedValidatorOnly(payload_) whenPaused {
        // if no ticket has been bought, no need to go further
        // ... limits expensive values reset
        if (_currentSet.infos.totalBoughtTickets == 0)
            return _resetLotteryState(new address[](0), 0, payload_);

        // pick winners
        address[] memory winners_ = _pickWinners(uint32(payload_.randomNumber));

        // split the pool prize amongst all winners after taxes
        uint256 amountWonByEachPlayer_ = _payManyPlayersTaxedRewards(
            winners_,
            _currentSet.infos.poolPrize
        );

        // reset values and emit event
        _resetLotteryState(winners_, amountWonByEachPlayer_, payload_);

        //
        if (mustRearmAfterPick_) _mayStartNewLottery();

        // check if we can transfer tax funds...
        _mayAutomaticallyTransfer();
    }

    //
    // PRIVATE / INTERNAL
    //

    /// if current lottery should be over after the next round of bought tickets
    function _isAwaitingLastBuyerToClose() private view returns (bool) {
        return _currentSet.duration.finishesAt < block.timestamp;
    }

    /** */
    event LotteryEnded(
        uint16 indexed setId,
        address indexed triggerer,
        bool mustRearmAfterPick
    );

    /// Pauses the current lottery round, ending it
    function _doPauseLottery(bool mustRearmAfterPick_) private {
        // if wants paused, tell the world the lottery has ended
        emit LotteryEnded(
            _currentSet.id,
            _latestTicketsOrder.orderer,
            mustRearmAfterPick_
        );

        //
        _traceTrustfulOrderM(
            TrustedPurpose.Lottery,
            _currentSet.id,
            _latestTicketsOrder.payload
        );

        //
        _currentSet.infos.state = LotteryState.WaitingPricesDistribution;

        //
        super.doPause();
    }

    /** @notice thrown when prices has not been given yet for the ongoing lottery set*/
    error UndistributedLotteryPrices();

    /** */
    event LotteryStarted(
        uint16 indexed setId,
        uint256 ticketCost,
        uint32 durationInSecs
    );

    /**
     * Create a new lottery
     */
    function _mayStartNewLottery() private {
        //
        if (_currentSet.infos.state != LotteryState.PricesDistributed)
            revert("UndistributedLotteryPrices");

        // reset values
        _currentSet.id++;
        _currentSet.rules = nextRuleset;
        _currentSet.duration.startsAt = uint32(block.timestamp);
        _currentSet.duration.finishesAt =
            uint32(block.timestamp) +
            nextRuleset.lotteryDurationInSecs;
        _currentSet.infos.state = LotteryState.Ongoing;

        //
        emit LotteryStarted(
            _currentSet.id,
            nextRuleset.ticketCost,
            nextRuleset.lotteryDurationInSecs
        );
    }

    /** */
    event WinnersPicked(
        uint16 indexed setId,
        address[] winners,
        uint256 amountWonPerWinner
    );

    /**
     * resets main flags and state, while emiting the event of the end of lottery
     */
    function _resetLotteryState(
        address[] memory winners_,
        uint256 amountWonPerWinner_,
        TrustfulResponsePayload calldata payload_
    ) private {
        // reset default values
        _currentSet.infos.poolPrize = 0;
        _currentSet.infos.totalBoughtTickets = 0;

        // reset unique partakers
        delete _currentSet.uniquePartakers;

        //
        _currentSet.infos.state = LotteryState.PricesDistributed;

        //
        // EMIT
        //

        emit WinnersPicked(_currentSet.id, winners_, amountWonPerWinner_);
        _traceTrustfulResponse(
            TrustedPurpose.Lottery,
            _currentSet.id,
            payload_
        );
    }

    /**
     * randomly picks winners among all current lottery partakers
     */
    function _pickWinners(uint32 randomNumber_)
        private
        view
        returns (address[] memory winners_)
    {
        //
        winners_ = new address[](_howManyWinners());

        //
        uint256 cumulative_;
        uint256 y_;
        uint256 bucket_;
        uint256 boughtTickets_ = _currentSet.infos.totalBoughtTickets;
        address[] memory partakers_ = _currentSet.uniquePartakers;
        uint8 pickRound_;

        // for each winner we need to pick...
        for (uint256 i_; i_ < winners_.length; i_++) {
            // add a round and reset cumulative
            pickRound_++;
            cumulative_ = 0;

            // get a random bucket based on remaining bought tickets
            bucket_ =
                uint256(
                    keccak256(abi.encodePacked(randomNumber_, pickRound_))
                ) %
                boughtTickets_;

            // iterate through remaining partakers...
            for (y_ = 0; y_ < partakers_.length; y_++) {
                // if partaker has already been cleared, means it has already won, skip
                if (partakers_[y_] == address(0)) continue;

                // add the total amount of tickets bought by this partaker
                cumulative_ += _ticketsBought[partakers_[y_]].howMany;

                // if the value is not inside of that bucket, keep looking
                if (cumulative_ < bucket_) continue;

                //
                // we have a winner !
                //

                // set current partaker as winner and remove him from the remaining partakers to pick from
                winners_[i_] = partakers_[y_];
                partakers_[y_] = address(0);

                // reduce the amount of tickets to be accounted
                boughtTickets_ -= _ticketsBought[partakers_[y_]].howMany;

                // pick the next winner !
                break;
            }
        }
    }

    /// gives back how many winners are supposed to win if the lottery ended
    function _howManyWinners() private view returns (uint8) {
        // no partakers ? no winners
        if (_currentSet.uniquePartakers.length == 0) return 0;

        // default behavior : rounded toward zero
        uint256 winnersCount_ = _currentSet.uniquePartakers.length /
            _currentSet.rules.newWinnerEveryXPartakers;

        // if we have players, but not enough to reach the first tier, we only pick 1 winner
        if (winnersCount_ == 0) return 1;

        // if computed winners count exceeds the maximum winners configured, use the configured value
        if (winnersCount_ > _currentSet.rules.maximumWinners)
            return _currentSet.rules.maximumWinners;

        //
        return uint8(winnersCount_);
    }
}
