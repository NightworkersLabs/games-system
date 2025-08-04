// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "@openzeppelin/contracts/interfaces/IERC721.sol";

import "./INightworkerInfosProvider.sol";

import "../enum/Nightworker.sol";

interface INightworkersGame is IERC721, INightworkerInfosProvider {
    // min-max notoriety score for a Pimp
    function MIN_PIMP_NOTORIETY_SCORE() external pure returns (uint8);

    function MAX_PIMP_NOTORIETY_SCORE() external pure returns (uint8);

    function notorietyOfPimp(uint16 tokenId_) external view returns (uint8);
}
