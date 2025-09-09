import { type EventFilter } from "ethers";
import { type Result } from "ethers/lib/utils.js";

import {
  TrustedValidatorWatcher,
  type TrustfulResponsePayload,
} from "#/src/lib/validator/watcher";

export class LotteryWatcher extends TrustedValidatorWatcher {
  //
  override _TRUSTED_PURPOSE_INDEX = 4;

  //
  override _REQUEST_EV = "LotteryEnded";

  override _getNonceFromOrder(clientOrder: Result): number {
    return clientOrder.setId;
  }

  override _getOrderedEventFilter(): EventFilter | undefined {
    return this._contract.filters.LotteryEnded?.();
  }

  override _getProcessedEventFilter(): EventFilter | undefined {
    return this._contract.filters.WinnersPicked?.();
  }

  override _orderExecutor(
    clientOrder: Result,
    responsePayload: TrustfulResponsePayload,
  ) {
    return this._contract.distributePrices(
      clientOrder.mustRearmAfterPick,
      responsePayload,
    );
  }
}
