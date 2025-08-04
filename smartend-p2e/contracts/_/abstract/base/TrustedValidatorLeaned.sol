// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/access/Ownable.sol";

import "./CreationTracked.sol";

pragma solidity 0.8.15;

abstract contract TrustedValidatorLeaned is Ownable, CreationTracked {
    /// enumerate all the kinds of purposes handled by the game that need random number generation
    enum TrustedPurpose {
        Mint,
        UnstakingHookers,
        Roulette,
        Coinflip,
        Lottery
    }

    /**
     * @dev client order payload
     * @param clientSeed can be 0, means that the client does not care about provably fairness
     * @param hashedSecret can be 0, means that the client does not care about provably fairness
     */
    struct TrustfulOrderPayload {
        uint256 clientSeed;
        uint256 hashedSecret;
    }

    ///
    struct IdentifiedTrustfuOrderPayload {
        address orderer;
        TrustfulOrderPayload payload;
    }

    /**
     * @dev response order payload
     *
     */
    struct TrustfulResponsePayload {
        bool wasHashedSecretLegitimate;
        uint256 usedSecret;
        uint256 randomNumber;
    }

    /**
     * @dev Emitted from a client tx
     * @param purpose what purpose we need to generate a random number for
     * @param nonce unique incremented ID by the contract, relative to context and purpose of the request
     * @param clientSeed a seed deliberately provided by the client, which can be used alongside the revealed server seed later to check if the random number generated is fair
     * @param hashedSecret the chosen hashed seed chosen by the client, provided by the trusted validator, which must be compliant with the revealed server secret later
     */
    event RandomNumberOrdered(
        TrustedPurpose indexed purpose,
        uint32 indexed nonce,
        uint256 clientSeed,
        uint256 hashedSecret
    );

    /**
     * @dev emitted from a trusted validator tx
     * @param purpose what purpose the random number was generated for
     * @param nonce unique incremented ID which the random number generation request was based on
     * @param wasHashedSecretLegitimate tells if the @hashedSecret which came alongside the RN request was considered safe (eg, not replayed or timed-out) by the trusted validator
     * @param usedSecret the server secret used to generate the random number. Depending on @wasHashedSecretLegitimate, can be either the original server secret associated with @hashedSecret or a new totally random one
     * @param randomNumber the random number generated
     */
    event RandomNumberGenerated(
        TrustedPurpose indexed purpose,
        uint32 indexed nonce,
        bool wasHashedSecretLegitimate,
        uint256 usedSecret,
        uint256 randomNumber
    );

    /// order helper
    function _traceTrustfulOrder(
        TrustedPurpose purpose_,
        uint32 nonce_,
        TrustfulOrderPayload calldata payload_
    ) internal {
        emit RandomNumberOrdered(
            purpose_,
            nonce_,
            payload_.clientSeed,
            payload_.hashedSecret
        );
    }

    /// order helper (for memory payload)
    function _traceTrustfulOrderM(
        TrustedPurpose purpose_,
        uint32 nonce_,
        TrustfulOrderPayload memory payload_
    ) internal {
        emit RandomNumberOrdered(
            purpose_,
            nonce_,
            payload_.clientSeed,
            payload_.hashedSecret
        );
    }

    /// response helper
    function _traceTrustfulResponse(
        TrustedPurpose purpose_,
        uint32 nonce_,
        TrustfulResponsePayload calldata payload_
    ) internal {
        emit RandomNumberGenerated(
            purpose_,
            nonce_,
            payload_.wasHashedSecretLegitimate,
            payload_.usedSecret,
            payload_.randomNumber
        );
    }

    // references to the trusted validator
    mapping(address => bool) internal _validator;

    ///
    function addTrustedValidator(address trustedValidator_) external onlyOwner {
        _addTrustedValidator(trustedValidator_);
    }

    ///
    function removeTrustedValidator(address trustedValidator_)
        external
        onlyOwner
    {
        _validator[trustedValidator_] = false;
    }

    /** @notice */
    error InvalidTrustedValidator();

    ///
    function _addTrustedValidator(address trustedValidator_) internal {
        if (trustedValidator_ == address(0)) revert("InvalidTrustedValidator");
        _validator[trustedValidator_] = true;
    }

    /// to be added to functions that will generate an order
    /// @dev kinda like a proxy method-signature, not mandatory but encouraged for logic purposes
    modifier trustedValidatorOrder(TrustfulOrderPayload calldata payload_) {
        _;
    }

    /** @notice thrown when anyone but a trusted validator calls bound functions */
    error TrustedValidatorOnly();

    /// to be added to functions that will be called by trusted validators
    modifier trustedValidatorOnly(TrustfulResponsePayload calldata payload_) {
        if(_validator[_msgSender()] == false) revert("TrustedValidatorOnly");
        _;
    }
}
