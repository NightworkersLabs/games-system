// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./_/interface/ILOLLY.sol";

contract LOLLY is ILOLLY, ERC20, Ownable {
    /// @dev a mapping from an address to whether or not it can mint / burn
    mapping(address => bool) public isController;

    /// @dev mapping of forbidden receivers of tokens, has to be other contracts
    mapping(address => bool) public invalidReceiver;

    constructor() ERC20("Night Workers LOLLY", "LOLLY") {}

    receive() external payable {}

    fallback() external payable {}

    /**
     * mints $LOLLY to a recipient
     * @param to_ the recipient of the $LOLLY
     * @param amount_ the amount of $LOLLY to mint
     */
    function mint(address to_, uint256 amount_)
        external
        override
        onlyController
    {
        _mint(to_, amount_);
    }

    /**
     * burns $LOLLY from a holder
     * @param from_ the holder of the $LOLLY
     * @param amount_ the amount of $LOLLY to burn
     */
    function burn(address from_, uint256 amount_)
        external
        override
        onlyController
    {
        _burn(from_, amount_);
    }

    //
    event ControllerAdded(address newController);

    /**
     * enables an address to mint / burn
     * @param toAdd_ the address to enable
     */
    function addController(address toAdd_) external onlyOwner {
        isController[toAdd_] = true;
        emit ControllerAdded(toAdd_);
    }

    //
    event ControllerRemoved(address controllerRemoved);

    /**
     * disable an address to mint / burn
     * @param toRemove_ the address to disable
     */
    function removeController(address toRemove_) external onlyOwner {
        isController[toRemove_] = false;
        emit ControllerRemoved(toRemove_);
    }

    /**
     * Use ERC20's balanceOf implementation
     */
    function balanceOf(address account_)
        public
        view
        override(ERC20, ILOLLY)
        returns (uint256)
    {
        return ERC20.balanceOf(account_);
    }

    /** @notice thrown when someone tried to call a mint / burn operations without beeing authorized */
    error CallerNotController();

    /**
     * only controllers
     */
    modifier onlyController() {
        if(isController[_msgSender()] == false) revert("CallerNotController");
        _;
    }

    //
    //
    //

    /** */
    event InvalidReceiverDefined(address receiver);

    /** */
    function defineAsInvalidReceiver(address receiver_) external onlyOwner {
        invalidReceiver[receiver_] = true;
        emit InvalidReceiverDefined(receiver_);
    }

    /** @notice thrown when the recipient of transfer is forbidden */
    error InvalidReceiver();

    /** */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override { 
        // if receiver is invalid AND proxied called is not receiver
        if (invalidReceiver[to] == true && msg.sender != to) {
            revert("InvalidReceiver");
        }

        //
        ERC20._transfer(from, to, amount);
    }
}
