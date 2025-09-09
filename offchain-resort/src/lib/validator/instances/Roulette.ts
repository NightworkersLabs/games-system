import { type EventFilter } from "ethers";
import { type Result } from "ethers/lib/utils.js";

import {
  TrustedValidatorWatcher,
  type TrustfulResponsePayload,
} from "#/src/lib/validator/watcher";

export class RouletteWatcher extends TrustedValidatorWatcher {
  //
  override _TRUSTED_PURPOSE_INDEX = 2;

  //
  override _REQUEST_EV = "RouletteSpinned";

  override _getNonceFromOrder(clientOrder: Result): number {
    return clientOrder.r_nonce;
  }

  override _getOrderedEventFilter(): EventFilter | undefined {
    return this._contract.filters.RouletteSpinned?.();
  }

  override _getProcessedEventFilter(): EventFilter | undefined {
    return this._contract.filters.RouletteStopped?.();
  }

  override _orderExecutor(
    clientOrder: Result,
    responsePayload: TrustfulResponsePayload,
  ) {
    return this._contract.stopRoulette(
      this._getNonceFromOrder(clientOrder),
      clientOrder.player,
      clientOrder.chosenColor,
      clientOrder.amountBet,
      responsePayload,
    );
  }
}
