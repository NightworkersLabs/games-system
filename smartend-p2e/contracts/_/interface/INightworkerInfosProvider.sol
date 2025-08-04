// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

interface INightworkerInfosProvider {
    function isHooker(uint16 tokenId_) external view returns (bool);
}
