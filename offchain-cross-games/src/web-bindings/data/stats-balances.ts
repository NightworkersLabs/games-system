import { type FastifyInstance } from "fastify";
import { type FromSchema } from "json-schema-to-ts";

import { getNetworkFilter } from "#/src/web-bindings/data/_";
import { cheapable } from "#/src/web-bindings/data/_schemas";
import type { PrismaClient } from "#prisma/client/index.js";

//
const uniqueFromChainIds = <T>(...obj: object[]): { [v: number]: T[] } => {
  //
  const w: { [key: string]: T[] } = {};

  //
  obj.forEach((a) => {
    Object.keys(a).forEach((k) => {
      if (w[k] == null) {
        w[k] = [];
      }
    });
  });

  //
  return w;
};

//
//
//

//
export const bindBalancesStatsToWebServer = (
  webServer: FastifyInstance,
  client: PrismaClient,
) => {
  //
  const getChipsBalanceAt = async (
    query: FromSchema<typeof cheapable>,
    pointInTime: Date,
  ) => {
    //
    const cb_p = client.casinoBank_ChipsBought.groupBy({
      by: ["chainId"],
      _sum: {
        amount: true,
      },
      where: {
        bts: {
          lte: pointInTime,
        },
        ...getNetworkFilter(query),
      },
    });

    //
    const cc_p = client.casinoBank_ChipsConverted.groupBy({
      by: ["chainId"],
      _sum: {
        coinsAmount: true,
      },
      where: {
        bts: {
          lte: pointInTime,
        },
        ...getNetworkFilter(query),
      },
    });

    //
    const [cb, cc] = await Promise.all([cb_p, cc_p]);

    // initiate balance data layout with only bought chips at first
    const balance = cb.reduce(
      (e, c) => {
        e[c.chainId] = c._sum.amount ?? 0;
        return e;
      },
      {} as { [chainId: number]: number },
    );

    // then, update it with withdraws
    cc.forEach((a) => {
      if (balance[a.chainId] == null) return;
      // ENFORCING type, balance would never be null
      (balance[a.chainId] as number) -= a._sum.coinsAmount ?? 0;
    });

    //
    return balance;
  };

  //
  const getBalanceMovements = async (
    query: FromSchema<typeof cheapable>,
    after: Date,
  ) => {
    //
    const cb_after_p = client.casinoBank_ChipsBought.findMany({
      select: {
        chainId: true,
        amount: true,
        bts: true,
      },
      where: {
        bts: {
          gt: after,
        },
        ...getNetworkFilter(query),
      },
    });

    //
    const cc_after_p = client.casinoBank_ChipsConverted.findMany({
      select: {
        chainId: true,
        coinsAmount: true,
        bts: true,
      },
      where: {
        bts: {
          gt: after,
        },
        ...getNetworkFilter(query),
      },
    });

    //
    const [cb_after, cc_after] = await Promise.all([cb_after_p, cc_after_p]);

    //
    //
    //

    //
    const history = cb_after.reduce(
      (out, i) => {
        //
        if (out[i.chainId] == null) {
          out[i.chainId] = [];
        }

        // ENFORCING type, array would never be empty
        (out[i.chainId] as [Date, number][]).push([i.bts, i.amount]);

        //
        return out;
        //
      },
      {} as { [chainId: number]: [Date, number][] },
    );

    //
    cc_after.forEach((e) => {
      //
      if (history[e.chainId] == null) {
        history[e.chainId] = [];
      }

      // ENFORCING type, array would never be empty
      (history[e.chainId] as [Date, number][]).push([e.bts, -e.coinsAmount]);
    });

    //
    return history;
  };

  //
  //
  //

  /** */
  webServer.get<{ Querystring: FromSchema<typeof cheapable> }>(
    "/balances-total",
    {
      schema: {
        querystring: cheapable,
      },
    },
    ({ query }) =>
      client.chipsBalance.groupBy({
        by: ["chainId"],
        _sum: {
          tBought: true,
          tWithdrawed: true,
          withdrawable: true,
        },
        where: {
          ...getNetworkFilter(query),
        },
      }),
  );

  /** */
  webServer.get<{ Querystring: FromSchema<typeof cheapable> }>(
    "/balances-evol",
    {
      schema: {
        querystring: cheapable,
      },
    },
    async ({ query }) => {
      // get current date - 30 days
      const now = new Date();
      const thirtyDaysBack = new Date(now.getTime());
      thirtyDaysBack.setDate(thirtyDaysBack.getDate() - 30);

      //
      const [balance_before, balance_movements] = await Promise.all([
        getChipsBalanceAt(query, thirtyDaysBack),
        getBalanceMovements(query, thirtyDaysBack),
      ]);

      //
      const layout = uniqueFromChainIds<[time: number, balance: number]>(
        balance_before,
        balance_movements,
      );
      const entries = Object.entries(layout);

      //
      entries.forEach(([chainId, array]) => {
        // casted
        const chainIdN = parseInt(chainId);

        // insert initial balance state
        let initialBalance = balance_before[chainIdN] ?? 0;
        array.push([thirtyDaysBack.getTime(), initialBalance]);

        // sort by date asc
        balance_movements[chainIdN]?.sort(
          (a, b) => a[0].getTime() - b[0].getTime(),
        );

        // evolve balance during time
        balance_movements[chainIdN]?.forEach(([date, mov]) => {
          // alter balance
          initialBalance += mov;

          // push state
          array.push([date.getTime(), initialBalance]);
        });

        const last = array[array.length - 1];

        //
        if (last == null || last.length < 2) {
          throw new Error("Invalid data");
        }

        // latest value as actual value
        array.push([now.getTime(), last[1]]);
      });

      //
      return Object.fromEntries(entries);
    },
  );
};
