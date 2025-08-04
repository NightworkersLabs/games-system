// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "../_/abstract/casino/RollingCasinoGame.sol";

contract TableGames is RollingCasinoGame {
    constructor(address trustedValidator_, address payable taxReceiver_)
        RollingCasinoGame(trustedValidator_, taxReceiver_, 200)
    {}

    //
    // COIN FLIP
    //

    event CoinFlipped(
        uint32 indexed cf_nonce,
        address indexed player,
        bool isHeads,
        uint256 amountBet
    );
    event CoinDropped(
        uint32 indexed cf_nonce,
        address indexed player,
        bool droppedOnHeads,
        uint256 amountWon
    );

    /// id of the latest coin flip
    uint32 public cf_nonce;

    function flipCoin(bool isHeads_, TrustfulOrderPayload calldata payload_)
        external
        payable
        whenNotPaused
        onlyEOA
        limitExpenses
        trustedValidatorOrder(payload_)
    {
        //
        //_lockIncomingFunds(msg.value;

        //
        cf_nonce++;

        //
        // EMIT
        //

        emit CoinFlipped(cf_nonce, _msgSender(), isHeads_, msg.value);
        _traceTrustfulOrder(TrustedPurpose.Coinflip, cf_nonce, payload_);

        // check if an automatic transfer can occur
        //_mayAutomaticallyTransfer();
    }

    function bringDownCoin(
        uint32 cf_nonce_,
        address player_,
        bool isHeads_,
        uint256 amountBet_,
        TrustfulResponsePayload calldata payload_
    ) external trustedValidatorOnly(payload_) {
        //
        //_unlockFunds(amountBet_);

        // flip the coin
        bool headsDropped_ = payload_.randomNumber % 2 == 1;

        // if won, double the initial bet MINUS taxes
        uint256 rewarded_ = (headsDropped_ == isHeads_)
            ? _payPlayerTaxedReward(player_, amountBet_, 2)
            : 0;

        //
        // EMIT
        //

        emit CoinDropped(cf_nonce_, player_, headsDropped_, rewarded_);
        _traceTrustfulResponse(TrustedPurpose.Coinflip, cf_nonce_, payload_);
    }

    //
    // ROULETTE
    //

    /// Green for 0
    /// Red for remaining even
    /// Black for odd
    enum RouletteColor {
        Green,
        Red,
        Black
    }

    event RouletteSpinned(
        uint32 indexed r_nonce,
        address indexed player,
        RouletteColor chosenColor,
        uint256 amountBet
    );
    event RouletteStopped(
        uint32 indexed r_nonce,
        address indexed player,
        RouletteColor stoppedOnColor,
        uint8 stoppedOnNumber,
        uint256 amountWon
    );

    /// id of the latest roulette spin
    uint32 public r_nonce;

    /// maximum face value upon which you can bet
    uint8 public constant ROULETTE_MAX_FACES = 14;

    // number of possible face values (including 0)
    uint8 private constant _ROULETTE_MAX_FACES_MOD = ROULETTE_MAX_FACES + 1;

    function minimumRollingFundsMultiplier()
        public
        pure
        override
        returns (uint8)
    {
        return ROULETTE_MAX_FACES;
    }

    function betOnGreen(TrustfulOrderPayload calldata payload_)
        external
        payable
    {
        betOnColor(RouletteColor.Green, payload_);
    }

    function betOnRed(TrustfulOrderPayload calldata payload_) external payable {
        betOnColor(RouletteColor.Red, payload_);
    }

    function betOnBlack(TrustfulOrderPayload calldata payload_)
        external
        payable
    {
        betOnColor(RouletteColor.Black, payload_);
    }

    //
    function betOnColor(
        RouletteColor betColor_,
        TrustfulOrderPayload calldata payload_
    )
        public
        payable
        whenNotPaused
        onlyEOA
        limitExpenses
        trustedValidatorOrder(payload_)
    {
        //
        //_lockIncomingFunds(msg.value);

        //
        r_nonce++;

        //
        // EMIT
        //

        emit RouletteSpinned(r_nonce, _msgSender(), betColor_, msg.value);
        _traceTrustfulOrder(TrustedPurpose.Roulette, r_nonce, payload_);

        // check if an automatic transfer can occur
        // _mayAutomaticallyTransfer();
    }

    //
    function stopRoulette(
        uint32 r_nonce_,
        address player_,
        RouletteColor betColor_,
        uint256 amountBet_,
        TrustfulResponsePayload calldata payload_
    ) external trustedValidatorOnly(payload_) {
        //
        //_unlockFunds(amountBet_);

        // get result
        uint256 stoppedOnNumber = payload_.randomNumber %
            _ROULETTE_MAX_FACES_MOD; // small negative bias on highest value :(
        RouletteColor rouletteResult_ = _getColorFromRouletteResult(
            stoppedOnNumber
        );

        // Give $LOLLY rewards minus taxes if guessed right
        // if Green, x14, else x2
        uint256 rewarded_ = rouletteResult_ == betColor_
            ? _payPlayerTaxedReward(
                player_,
                amountBet_,
                betColor_ == RouletteColor.Green ? ROULETTE_MAX_FACES : 2
            )
            : 0;

        //
        // EMIT
        //

        emit RouletteStopped(
            r_nonce_,
            player_,
            rouletteResult_,
            uint8(stoppedOnNumber),
            rewarded_
        );
        _traceTrustfulResponse(TrustedPurpose.Roulette, r_nonce_, payload_);
    }

    //
    function _getColorFromRouletteResult(uint256 rouletteResult_)
        private
        pure
        returns (RouletteColor)
    {
        // GREEN !
        if (rouletteResult_ == 0) return RouletteColor.Green;

        //
        return
            rouletteResult_ == 10 ||
                rouletteResult_ == 9 ||
                rouletteResult_ == 11 ||
                rouletteResult_ == 5 ||
                rouletteResult_ == 1 ||
                rouletteResult_ == 6 ||
                rouletteResult_ == 2
                ? RouletteColor.Black
                : RouletteColor.Red;
    }
}
