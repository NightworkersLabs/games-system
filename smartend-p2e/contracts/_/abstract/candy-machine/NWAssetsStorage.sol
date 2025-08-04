// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../../enum/TraitType.sol";
import "../../enum/Nightworker.sol";

contract NWAssetsStorage is Ownable {
    // struct to store each trait's data for metadata and rendering
    struct Trait {
        string name;
        string png;
    }

    // storage of each traits name and base64 PNG data
    // isHooker >> TraitType >> TraitNo >> Trait
    mapping(bool => mapping(TraitType => mapping(uint8 => Trait)))
        private _traitData;

    // isHooker >> TraitType >> number of assets
    mapping(bool => mapping(TraitType => uint8)) private _traitCountForType;

    /**
     * Helper to conveniently get assets count
     * @param isHooker_ token type
     * @param traitType_ trait type to count available assets from
     * @return number of assets for this trait type
     */
    function _getAssetsCountForTraitType(bool isHooker_, TraitType traitType_)
        internal
        view
        returns (uint8)
    {
        return _traitCountForType[isHooker_][traitType_];
    }

    /**
     * Helper to conveniently get trait at specified index
     */
    function _getTraitAtIndex(
        bool isHooker_,
        TraitType traitType_,
        uint8 index_
    ) internal view returns (Trait storage) {
        return _traitData[isHooker_][traitType_][index_];
    }

    /***ADMIN */

    /** @notice thrown when related arrays in function argument sizes differ */
    error MissmatchingArgumentsLength();

    /** @notice thrown when trying to configure too much assets for a defined trait type */
    error InsertingTooMuchAssets();
    

    /**
     * OWNER ONLY
     * administrative to upload the names and images associated with each trait
     * @param traitType_ the trait type to upload the traits for (see traitTypes for a mapping)
     * @param traits_ the names and base64 encoded PNGs for each trait
     */
    function uploadTraits(
        bool isHooker_,
        TraitType traitType_,
        uint8[] calldata traitIds_,
        Trait[] calldata traits_
    ) external onlyOwner {
        //
        if(traitIds_.length != traits_.length) revert("MissmatchingArgumentsLength");
        if(_getAssetsCountForTraitType(isHooker_, traitType_) + traits_.length > 32) revert("InsertingTooMuchAssets");

        // cannot loop above traitId data type limite
        for (uint8 i_; i_ < traits_.length; i_++) {
            _traitData[isHooker_][traitType_][traitIds_[i_]] = Trait(
                traits_[i_].name,
                traits_[i_].png
            );
        }

        // add to count
        _traitCountForType[isHooker_][traitType_] += uint8(traits_.length);
    }
}
