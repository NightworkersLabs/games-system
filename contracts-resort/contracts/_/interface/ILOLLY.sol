// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

interface ILOLLY {
    function burn(address from_, uint256 amount_) external;

    function mint(address to_, uint256 amount_) external;

    function balanceOf(address account_) external view returns (uint256);
}
