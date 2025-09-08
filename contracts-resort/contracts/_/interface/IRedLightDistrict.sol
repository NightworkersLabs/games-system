// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

interface IRedLightDistrict {
    function mayPickStealerPimp(address minterToBeStoken_, uint256 seed_)
        external
        view
        returns (address, uint16);
}
