// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "./INightworkerInfosProvider.sol";

import "../enum/TraitType.sol";

interface ICandyMachine is INightworkerInfosProvider {
    function tokenURI(uint16 tokenId_) external view returns (string memory);

    function otfTokenURI(uint16 tokenId_) external view returns (string memory);

    function generateUnique(
        uint16 tokenId_,
        uint8 tokenGenerationID_,
        uint128 seed_,
        uint8 typeSeed_
    ) external;

    function notorietyIndexOfToken(uint16 tokenId_)
        external
        view
        returns (uint8);
}
