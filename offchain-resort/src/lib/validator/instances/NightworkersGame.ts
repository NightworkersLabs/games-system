import type { EventFilter } from "ethers";
import type { Result } from "ethers/lib/utils.js";

import {
  TrustedValidatorWatcher,
  type TrustfulResponsePayload,
} from "#/src/lib/validator/watcher";

export class NWGWatcher extends TrustedValidatorWatcher {
  //
  override _TRUSTED_PURPOSE_INDEX = 0;

  //
  override _REQUEST_EV = "MintOrdered";

  override _getNonceFromOrder(clientOrder: Result): number {
    return clientOrder.atMinted;
  }

  override _getOrderedEventFilter(): EventFilter | undefined {
    return this._contract.filters.MintOrdered?.();
  }

  override _getProcessedEventFilter(): EventFilter | undefined {
    return this._contract.filters.MintOrderProcessed?.();
  }

  override _orderExecutor(
    clientOrder: Result,
    responsePayload: TrustfulResponsePayload,
  ) {
    return this._contract.processMintOrder(
      this._getNonceFromOrder(clientOrder),
      clientOrder.minter,
      clientOrder.howMany,
      clientOrder.generation,
      responsePayload,
    );
  }
}
