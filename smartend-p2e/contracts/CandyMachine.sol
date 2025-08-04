// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "./_/interface/ICandyMachine.sol";

import "./_/abstract/base/NightworkersInteractor.sol";
import "./_/abstract/candy-machine/NWTokenMetadata.sol";

contract CandyMachine is
    ICandyMachine,
    NWTokenMetadata,
    NightworkersInteractor
{
    // mapping from tokenId to a struct containing the token's candy machine
    mapping(uint16 => Nightworker) private _tokenTraits;
    // mapping from hashed(tokenTrait) to the tokenId it's associated with
    // used to ensure there are no duplicates
    mapping(uint256 => uint16) private _existingCombinations;
    // URI API base
    string public BASE_TOKEN_URI;

    //
    enum GenerationMode {
        Random,
        HookerOnly,
        PimpOnly
    }

    GenerationMode private _generationMode;

    constructor(string memory BASE_TOKEN_URI_) {
        updateBaseTokenUri(BASE_TOKEN_URI_);
    }

    // #if DEBUG
    /**
     * OWNER ONLY
     * controls the token generation process.
     * @dev pass as 'internal' to allow debuging with 'hardhat-exposed'
     * @param mode_ mode to apply
     */
    function _defineGenerationMode(GenerationMode mode_) internal onlyOwner {
        _generationMode = mode_;
    }

    // #endif

    /**
     * OWNER ONLY
     */
    function updateBaseTokenUri(string memory BASE_TOKEN_URI_) public onlyOwner {
        BASE_TOKEN_URI = BASE_TOKEN_URI_;
    }

    /**
     * generates Traits for a specific token, checking to make sure it's unique
     * It gets more and more expensive to get unique NFTs as tokens are minted
     * @param tokenId_ the id of the token to generate traits for
     * @param seed_ a pseudo-random 128 bit number to derive traits from
     * @param typeSeed_ a safer pseudo-random 8 bit number to derive type from
     * @param tokenGenerationID_ generation ID to bind to the future generatd token
     */
    function generateUnique(
        uint16 tokenId_,
        uint8 tokenGenerationID_,
        uint128 seed_,
        uint8 typeSeed_
    ) external override onlyMintingGame {
        //
        bool isHooker_ = _generationMode == GenerationMode.Random
            ? _pickHookerOrPimp(typeSeed_)
            : _isHookerFromGenerationMode();

        // get randomly generated traits from candy machine, and store it immediately
        uint256 hashOfToken_;
        (_tokenTraits[tokenId_], hashOfToken_) = _generateUnique(
            tokenId_,
            seed_,
            isHooker_,
            0
        );

        // mark this traits combination hash as an existing combination
        _existingCombinations[hashOfToken_] = tokenId_;

        // define generation ID if not a default value
        if (tokenGenerationID_ != 0)
            _tokenTraits[tokenId_].generation = tokenGenerationID_;
    }

    /**
     * RECURSIVE
     * generates Traits for a specific token, checking to make sure it's unique
     * It gets more and more expensive to get unique NFTs as tokens are minted
     * @param tokenId_ the id of the token to generate traits for
     * @param seed_ a pseudo-random 128 bit number to derive traits from
     * @param isHooker_ defined type of the generated night worker
     * @param attempt_ incremented at each round this function iterates (255 max attempts, should be out of gas before reaching it)
     * @return t_ - a struct of Nightworker for the given token ID
     */
    function _generateUnique(
        uint16 tokenId_,
        uint128 seed_,
        bool isHooker_,
        uint8 attempt_
    ) private returns (Nightworker memory t_, uint256 hashOfToken_) {
        // updates the seed at each attempt
        attempt_++;
        seed_ = uint128(uint256(keccak256(abi.encodePacked(seed_, attempt_))));

        // get randomly generated traits from candy machine
        t_ = _pickRandomTraits(seed_, isHooker_);

        // get its hash
        hashOfToken_ = _structToHash(t_);

        // check if this token traits print has already been registered to another token
        if (_existingCombinations[hashOfToken_] != 0)
            return _generateUnique(tokenId_, seed_, isHooker_, attempt_); // keeps searching for unregistered traits

        //
        // if not, great ! register it as a genuine unique token !
        //

        return (t_, hashOfToken_);
    }

    /**
     * @dev quite close to 90 percent chance of being true given a big enough sample (> 50k), slightly advantageous to Pimps generation
     */
    function _pickHookerOrPimp(uint8 seed_) internal pure returns (bool) {
        return seed_ % 10 != 0;
    }

    /**
     *
     */
    function _isHookerFromGenerationMode() private view returns (bool) {
        return _generationMode == GenerationMode.HookerOnly ? true : false;
    }

    /**
     * selects all of a night worker traits based on the seed value
     * @param seed_ a pseudo-random 128 bit number to derive traits from (we need 16 bits per trait)
     * @param isHooker_ defined type of the generated night worker
     * @dev we need quite a lot of margin in bytes for each traits to pick,
     * @dev we need that to prevent a significant advantage biais with modulo operations
     * @return t_ -  a struct of an unique randomly selected traits
     */
    function _pickRandomTraits(uint128 seed_, bool isHooker_)
        private
        view
        returns (Nightworker memory t_)
    {
        t_.isHooker = isHooker_;

        t_.bodyIndex = _randomPickTrait(seed_, isHooker_, TraitType.Body);

        seed_ >>= 16;
        t_.attireIndex = _randomPickTrait(seed_, isHooker_, TraitType.Attire);

        seed_ >>= 16;
        t_.hairIndex = _randomPickTrait(seed_, isHooker_, TraitType.Hair);

        seed_ >>= 16;
        t_.faceIndex = _randomPickTrait(seed_, isHooker_, TraitType.Face);

        seed_ >>= 16;
        t_.eyesIndex = _randomPickTrait(seed_, isHooker_, TraitType.Eyes);

        seed_ >>= 16;
        t_.headgearIndex = _randomPickTrait(
            seed_,
            isHooker_,
            TraitType.Headgear
        );

        seed_ >>= 16;
        t_.mouthIndex = _randomPickTrait(seed_, isHooker_, TraitType.Mouth);

        if (!isHooker_) {
            seed_ >>= 16;
            t_.notorietyIndex = _randomPickNotorietyIndex(seed_);
        }
    }

    /**
     * converts a struct to a 256 bit hash to check for uniqueness
     * @param s_ the struct to pack into a hash
     * @return the 256 bit hash of the struct
     */
    function _structToHash(Nightworker memory s_)
        private
        pure
        returns (uint256)
    {
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        s_.isHooker,
                        s_.bodyIndex,
                        s_.attireIndex,
                        s_.hairIndex,
                        s_.faceIndex,
                        s_.eyesIndex,
                        s_.headgearIndex,
                        s_.mouthIndex,
                        s_.notorietyIndex
                    )
                )
            );
    }

    /** @notice thrown when no traits has been configured on a given trait type */
    error NoTraitsOnTraitType();

    /**
     * Picks the appropriate method to choose the value to apply to a token's trait
     * @dev pass as 'internal' to allow debuging with 'hardhat-exposed'
     * @param seed_ random value which influences value picking
     * @param isHooker_ determines which kind of token to process
     * @param traitType_ determine which trait type it is applied to
     * @return appropriate asset or notoriety index
     */
    function _randomPickTrait(
        uint256 seed_,
        bool isHooker_,
        TraitType traitType_
    ) internal view returns (uint8) {
        //
        uint8 assetsCount_ = _getAssetsCountForTraitType(isHooker_, traitType_);
        if(assetsCount_ == 0) revert("NoTraitsOnTraitType");

        //
        return uint8(seed_ % assetsCount_);
    }

    /**
     * the more the index, the worse the strength of the Pimp
     * around 5 prc. of Pimps are to be "Extraordinary"
     * around 15 prc. of Pimps are to be "Marvelous"
     * around 30 prc. of Pimps are to be "Unusual"
     * around 50 prc. of Pimps are to be "Normal"
     * @dev numbers tweaked to lower modulo bias upon uint8 as seed base
     * @dev tends to produce more very rares than commons
     *
     */
    function _randomPickNotorietyIndex(uint256 seed_)
        internal
        pure
        returns (uint8)
    {
        // get pseudo-random percentage from seed
        uint256 m_ = (seed_ & 0xFF) % 100;

        // "Extraordinary", top 5 percent
        if (m_ >= 93) {
            return 0;
        }
        // "Marvelous", top 20 percent
        else if (m_ >= 74) {
            return 1;
        }
        // "Unusual", top 5O percent
        else if (m_ >= 42) {
            return 2;
        }
        // "Normal", bottom 50 percent
        return 3;
    }

    /**
     * builds the token URI pointing to an off-chain platform
     * @param tokenId_ the ID of the token to generate the metadata for
     * @return an url
     */
    function tokenURI(uint16 tokenId_)
        external
        view
        override
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(
                    BASE_TOKEN_URI,
                    _tokenIdForURI(tokenId_, _tokenTraits[tokenId_])
                )
            );
    }

    /**
     * generates a base64 encoded metadata response without referencing off-chain content (on-the-fly)
     * @param tokenId_ the ID of the token to generate the metadata for
     * @return a base64 encoded JSON dictionary of the token's metadata and SVG
     */
    function otfTokenURI(uint16 tokenId_)
        external
        view
        override
        returns (string memory)
    {
        return string(_otfTokenURI(tokenId_, _tokenTraits[tokenId_]));
    }

    //
    //
    //

    function notorietyIndexOfToken(uint16 tokenId_)
        external
        view
        override
        returns (uint8)
    {
        return _tokenTraits[tokenId_].notorietyIndex;
    }

    function isHooker(uint16 tokenId_) external view override returns (bool) {
        return _tokenTraits[tokenId_].isHooker;
    }
}
