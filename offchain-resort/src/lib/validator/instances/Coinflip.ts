import type { EventFilter } from "ethers";
import type { Result } from "ethers/lib/utils.js";

import {
  TrustedValidatorWatcher,
  type TrustfulResponsePayload,
} from "#/src/lib/validator/watcher";

export class CFWatcher extends TrustedValidatorWatcher {
  //
  override _TRUSTED_PURPOSE_INDEX = 3;

  //
  override _REQUEST_EV = "CoinFlipped";

  override _getNonceFromOrder(clientOrder: Result): number {
    return clientOrder.cf_nonce;
  }

  override _getOrderedEventFilter(): EventFilter | undefined {
    return this._contract.filters.CoinFlipped?.();
  }

  override _getProcessedEventFilter(): EventFilter | undefined {
    return this._contract.filters.CoinDropped?.();
  }

  override _orderExecutor(
    clientOrder: Result,
    responsePayload: TrustfulResponsePayload,
  ) {
    return this._contract.bringDownCoin(
      this._getNonceFromOrder(clientOrder),
      clientOrder.player,
      clientOrder.isHeads,
      clientOrder.amountBet,
      responsePayload,
    );
  }
}
