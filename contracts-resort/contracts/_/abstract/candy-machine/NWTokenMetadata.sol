// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

import "./NWAssetsStorage.sol";

contract NWTokenMetadata is NWAssetsStorage {
    // to parse token ID into String
    using Strings for uint16;
    using Strings for uint8;
    using Strings for bool;

    // mapping from notorietyIndex to its score
    string[4] private _notorieties = [
        "+3 (Extraordinary)"
        "+2 (Marvelous)",
        "+1 (Unusual)",
        "+0 (Normal)"
    ];

    //
    string[8] private _traitTypesDesc = [
        "Body",
        "Attire",
        "Hair",
        "Face",
        "Eyes",
        "Headgear",
        "Mouth",
        "Notoriety"
    ];

    bytes private constant _empty = "";
    bytes private constant _uriPartSpacer = "-";

    /***RENDER */

    /**
     * generates an <image> element using base64 encoded PNGs
     * @return the <image> element
     */
    function _drawTrait(
        bool isHooker_,
        TraitType traitType_,
        uint8 index_
    ) private view returns (bytes memory) {
        return
            abi.encodePacked(
                '<image height="100%" xlink:href="data:image/png;base64,',
                _getTraitAtIndex(isHooker_, traitType_, index_).png,
                '"/>'
            );
    }

    /**
     * generates an entire SVG by composing multiple <image> elements of PNGs
     * @param s_ traits data of the token
     * @return a valid SVG of the Hooker / Pimp
     */
    function _drawSVG(Nightworker memory s_)
        private
        view
        returns (bytes memory)
    {
        //
        return
            abi.encodePacked(
                '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="NightworkersGameP2E" image-rendering="pixelated" viewBox="0 0 350 350">',
                _drawTrait(s_.isHooker, TraitType.Body, s_.bodyIndex),
                _drawTrait(s_.isHooker, TraitType.Attire, s_.attireIndex),
                _drawTrait(s_.isHooker, TraitType.Hair, s_.hairIndex),
                _drawTrait(s_.isHooker, TraitType.Face, s_.faceIndex),
                _drawTrait(s_.isHooker, TraitType.Eyes, s_.eyesIndex),
                _drawTrait(s_.isHooker, TraitType.Headgear, s_.headgearIndex),
                _drawTrait(s_.isHooker, TraitType.Mouth, s_.mouthIndex),
                !s_.isHooker
                    ? _drawTrait(
                        s_.isHooker,
                        TraitType.Notoriety,
                        s_.notorietyIndex
                    )
                    : _empty,
                "</svg>"
            );
    }

    /**
     * generates an attribute for the attributes array in the ERC721 metadata standard
     * @param traitType_ the trait type to reference as the metadata key
     * @param value_ the token's trait associated with the key
     * @return a JSON dictionary for the single attribute
     */
    function _attributeForTypeAndValue(
        string memory traitType_,
        string memory value_,
        bool comma_
    ) private pure returns (bytes memory) {
        return
            abi.encodePacked(
                "{ "
                '"trait_type" : "',
                traitType_,
                '", '
                '"value" : "',
                value_,
                '"'
                " }",
                comma_ ? ", " : ""
            );
    }

    /**
     * generates an attribute for the attributes array in the ERC721 metadata standard
     * @param isHooker_ explicit enough
     * @param traitType_ the trait type to reference as the metadata key
     * @param traitIndex_ the token's trait associated with the key
     * @return a JSON dictionary for the single attribute
     */
    function _attributeForTraitAndIndex(
        bool isHooker_,
        TraitType traitType_,
        uint8 traitIndex_,
        bool comma_
    ) private view returns (bytes memory) {
        return
            _attributeForTypeAndValue(
                _traitTypesDesc[uint8(traitType_)],
                _getTraitAtIndex(isHooker_, traitType_, traitIndex_).name,
                comma_
            );
    }

    /**
     * generates an array composed of all the individual traits and values
     * @param s_ traits data of the token
     * @return a JSON array of all of the attributes for given token ID
     */
    function _compileAttributes(Nightworker memory s_)
        private
        view
        returns (bytes memory)
    {
        //
        bytes memory traits_ = abi.encodePacked(
            _attributeForTraitAndIndex(
                s_.isHooker,
                TraitType.Body,
                s_.bodyIndex,
                true
            ),
            _attributeForTraitAndIndex(
                s_.isHooker,
                TraitType.Attire,
                s_.attireIndex,
                true
            ),
            _attributeForTraitAndIndex(
                s_.isHooker,
                TraitType.Hair,
                s_.hairIndex,
                true
            ),
            _attributeForTraitAndIndex(
                s_.isHooker,
                TraitType.Face,
                s_.faceIndex,
                true
            ),
            _attributeForTraitAndIndex(
                s_.isHooker,
                TraitType.Eyes,
                s_.eyesIndex,
                true
            ),
            _attributeForTraitAndIndex(
                s_.isHooker,
                TraitType.Headgear,
                s_.headgearIndex,
                true
            ),
            _attributeForTraitAndIndex(
                s_.isHooker,
                TraitType.Mouth,
                s_.mouthIndex,
                s_.isHooker ? false : true
            ),
            !s_.isHooker
                ? _attributeForTraitAndIndex(
                    false,
                    TraitType.Notoriety,
                    s_.notorietyIndex,
                    true
                )
                : _empty,
            !s_.isHooker
                ? _attributeForTypeAndValue(
                    "Notoriety Score",
                    _notorieties[s_.notorietyIndex],
                    false
                )
                : _empty
        );

        //
        return
            abi.encodePacked(
                "[",
                _attributeForTypeAndValue(
                    "Type",
                    s_.isHooker ? "Hooker" : "Pimp",
                    true
                ),
                _attributeForTypeAndValue(
                    "Generation",
                    s_.generation == 0 ? "Gen 0" : "Gen 1",
                    true
                ),
                traits_,
                "]"
            );
    }

    /** builds the right part of the tokenURI(), identifying a unique token metadata */
    function _tokenIdForURI(uint16 tokenId_, Nightworker storage s_)
        internal
        view
        returns (bytes memory)
    {
        return
            abi.encodePacked(
                tokenId_.toString(),
                _uriPartSpacer,
                s_.isHooker ? "0" : "1",
                _tokenIdFragmentForURI(s_.generation),
                _tokenIdBodyFragmentsForURI(s_),
                !s_.isHooker
                    ? _tokenIdFragmentForURI(s_.notorietyIndex)
                    : _empty
            );
    }

    /** helper to circumvent the "stack too deep" compiler issue */
    function _tokenIdBodyFragmentsForURI(Nightworker storage s_)
        internal
        view
        returns (bytes memory)
    {
        return
            abi.encodePacked(
                _tokenIdFragmentForURI(s_.bodyIndex),
                _tokenIdFragmentForURI(s_.attireIndex),
                _tokenIdFragmentForURI(s_.hairIndex),
                _tokenIdFragmentForURI(s_.faceIndex),
                _tokenIdFragmentForURI(s_.eyesIndex),
                _tokenIdFragmentForURI(s_.headgearIndex),
                _tokenIdFragmentForURI(s_.mouthIndex)
            );
    }

    /** helper to circumvent the "stack too deep" compiler issue */
    function _tokenIdFragmentForURI(uint8 index_)
        private
        pure
        returns (bytes memory)
    {
        return abi.encodePacked(_uriPartSpacer, index_.toString());
    }

    /**
     * generates a base64 encoded metadata response without referencing off-chain content (on-the-fly)
     * @param tokenId_ the ID of the token to generate the metadata for
     * @param s_ traits data of the token
     * @return a base64 encoded JSON dictionary of the token's metadata and SVG
     */
    function _otfTokenURI(uint16 tokenId_, Nightworker storage s_)
        internal
        view
        returns (bytes memory)
    {
        return
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(
                    abi.encodePacked(
                        "{ "
                        '"name" : "',
                        s_.isHooker ? "Hooker #" : "Pimp #",
                        tokenId_.toString(),
                        '", '
                        '"description" : "'
                        "Night Workers is a play-to-earn NFT game forked from the popular Police and Thief game. "
                        "As its model, It incorporates probability-based NFT derivatives, with the same well-known engaging and exciting features. "
                        "This time, it is Hookers vs Pimps : which side are you on ? Richness is now at every street corner !"
                        '", '
                        '"image": "'
                        "data:image/svg+xml;base64,",
                        Base64.encode(_drawSVG(s_)),
                        '", '
                        '"attributes" : ',
                        _compileAttributes(s_),
                        " }"
                    )
                )
            );
    }
}
