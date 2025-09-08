  with pepe as (
    SELECT id, address, ts, won, pf
    FROM "nw-chips-bank"."CoinflipPlays"
    where "chainId" = 97 and ts between '2022-09-16 19:00:00.000' and now()
    order by ts
  ), popo as (
    SELECT id, address, ts, won, pf
    FROM "nw-chips-bank"."RoulettePlays"
    where "chainId" = 97 and ts between '2022-09-16 19:00:00.000' and now()
    order by ts
  ), pepeg as (
    select * from pepe 
    union 
    select * from popo
  ), okay as (
    select address, count(*) "parties_jouées", Sum(case won when 0 then 0 else 1 end) "parties_gagnées", SUM(won) "gains_cumulés"
    from pepeg 
    group by address
  )
select *, "parties_gagnées" / "parties_jouées" "winrate_parties", "parties_gagnées" / "gains_cumulés" "winrate_gains" 
from okay;
