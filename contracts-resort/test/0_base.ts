import "#/test/_context";

import { NightworkersContext } from "#/scripts/deploy/framework/NWContext";
import { testFramework } from "#/test/1_testFramework";
import { testGame } from "#/test/2_game";

describe("Nightworkers P2E", function () {
  before(async function () {
    this.nwContext = new NightworkersContext("./deployment_history.txt", true);
  });

  testFramework();
  testGame();
});
