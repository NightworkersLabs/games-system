// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "./Withdrawable.sol";

abstract contract AutomaticTransferer is Withdrawable {
    event EmergencyTransfered(uint256 amountSent);
    event Transfered(uint256 amountSent, bool manualTrigger);

    /// the recipient of the automated transfered funds
    address payable public immutable receiver;

    ///
    bool public automaticTransferEnabled = true;

    /// once minimum funds on balance are met, wait until this excedent amount has been reached before being allowed to transfer to recipient
    uint256 public flatExcedentaryFundsExpected;

    // ensure there will be at least this amount in balance before even thinking of transfering
    uint256 public minimumBalanceEnsured;

    // locked funds that will not be transfered until unlocked, useful when delayed handling of the outcome of said funds (eg. Trustful Orders)
    uint256 private _lockedFunds;

    /** @notice thrown when no receiver address has been configured on deployment */
    error NoAutoTransferReceiver();

    constructor(
        address payable receiver_,
        uint256 flatExcedentaryFundsExpected_
    ) {
        //
        if(receiver_ == address(0)) revert("NoAutoTransferReceiver");

        //
        receiver = receiver_;
        _setFlatExcedentaryFundsExpected(flatExcedentaryFundsExpected_);
    }

    //
    // PUBLIC (VIEW)
    //

    //
    function getExcedentaryBalance() public view returns (uint256) {
        // get balance
        uint256 balance_ = address(this).balance;

        // updates balance to account locked funds
        uint256 lockedFunds_ = _lockedFunds;
        if (lockedFunds_ >= balance_) return 0; // locked funds should not exceed balance, might mean that manual transfers occured. Calling loosenFundsLock() might be required
        balance_ -= lockedFunds_;

        // checks that the balance meets the criterias
        uint256 minimumFundsOnBalance_ = minimumBalanceEnsured;
        if (balance_ <= minimumFundsOnBalance_ + flatExcedentaryFundsExpected)
            return 0;

        //
        return balance_ - minimumFundsOnBalance_;
    }

    //
    // PUBLIC (OWNER ONLY)
    //

    ///
    function enableAutomaticTransfer(bool enable_) external onlyOwner {
        automaticTransferEnabled = enable_;
    }

    //
    function setFlatExcedentaryFundsExpected(
        uint256 flatExcedentaryFundsExpected_
    ) external onlyOwner {
        _setFlatExcedentaryFundsExpected(flatExcedentaryFundsExpected_);
    }

    //
    function loosenFundsLock(uint256 loosenAt_) external onlyOwner {
        _lockedFunds = loosenAt_;
    }

    /**
     * OWNER ONLY
     * triggers an emergency transfer of funds, will most probably break this contract intrinsic behavior
     * @dev no reentracy-guard needed
     */
    function triggerEmergencyTransfer() external onlyOwner {
        //
        uint256 toTransfer_ = address(this).balance;
        
        // emit first
        emit EmergencyTransfered(toTransfer_);

        // https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/
        (bool success, ) = receiver.call{value: toTransfer_}("");
        require(success, "triggerEmergencyTransfer() failed.");
    }

    /** @notice thrown when no excendentary balance can be transfered */
    error NoExcedentaryBalanceToTransfer();

    /**
     * @dev let anyone do this, it is safe
     * @dev no reentracy-guard needed
     */
    function triggerFundsTransfer() external {
        //
        uint256 toTransfer_ = getExcedentaryBalance();

        //
        if(toTransfer_ == 0) revert("NoExcedentaryBalanceToTransfer");

        // emit first
        emit Transfered(toTransfer_, true);

        // https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/
        (bool success, ) = receiver.call{value: toTransfer_}("");
        require(success, "triggerFundsTransfer() failed.");
    }

    //
    // HELPERS (PRIVATE / INTERNAL)
    //

    //
    function _defineMinimumFundsOnBalance(uint256 minimumFundsOnBalance_)
        internal
    {
        minimumBalanceEnsured = minimumFundsOnBalance_;
    }

    //
    function _setFlatExcedentaryFundsExpected(
        uint256 flatExcedentaryFundsExpected_
    ) private {
        flatExcedentaryFundsExpected = flatExcedentaryFundsExpected_;
    }

    //
    // INTERNAL
    //

    /// @dev fundsToLock_ must be exactly msg.value each time
    function _lockIncomingFunds(uint256 fundsToLock_) internal {
        _lockedFunds += fundsToLock_;
    }

    ///
    function _unlockFunds(uint256 fundsToUnlock_) internal {
        _lockedFunds -= fundsToUnlock_;
    }

    /**
     * To be called from inheritor contract to maybe trigger an automatic transfer
     * @dev CAREFUL, make sure to prevent reentrancy with a guard OR call this function after all contract state modifications has been done !
     */ 
    function _mayAutomaticallyTransfer() internal {
        // if disabled, just skip
        if (!automaticTransferEnabled) return;

        // finds the amount to transfer to the automatic recipient
        uint256 toTransfer_ = getExcedentaryBalance();
        if (toTransfer_ == 0) return;

        // send the event
        emit Transfered(toTransfer_, false);

        // https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/
        (bool success, ) = receiver.call{value: toTransfer_}("");
        require(success, "automaticTransfer() failed.");
    }
}
