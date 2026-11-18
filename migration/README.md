# Migration from v1

The v2 contracts start from the state of the v1 contracts at a single block. This folder holds that state, so anyone
can check that the v2 deployment reproduces v1.

## Snapshot

`snapshots/v1-3831863/` is the v1 state at block 3,831,863 of the Sintrop network (chain id 250225), read by
`scripts/migration/snapshot.js`:

- `meta.json`: block, block hash, v1 addresses and the era clock (`deployedAt`) of each pool.
- `events.json`: every event emitted by the v1 contracts up to the snapshot block, in chain order.
- `<Contract>.json`: state of each contract (public getters and private mappings read from storage). Mapping entries
  with default values are omitted.

Actions on v1 after the snapshot block are not migrated.

## How the migration works

1. `deploy`: the contracts are deployed with the v1 parameters. Each pool receives its v1 `deployedAt`, so eras keep
   the v1 clock.
2. `import`: the migrator (deployer) writes the snapshot state with the `migrate*` functions and replays the v1 events
   with their original topics and data (`migrateLogs`). Token balances are regular transfers.
3. `verify`: the new deployment is read with the same snapshot reader and compared with v1.
4. `close`: `closeMigration()` sets `migrator` to the zero address in every contract, disabling the migration
   functions forever.
5. `renounce`: the ownership of the contracts is renounced. `InvitationRules` keeps its owner, as in v1.

See `scripts/migration/migrate.js`.

## Expected differences

- `votersCount` and `votesToInvalidate`: activists are no longer counted as voters, and invalidations require at
  least 3 votes.
- Token allowances are not migrated.
- Regeneration index descriptions follow the new thresholds.
- Replayed events carry the block and timestamp of the migration.

## Era 0 scenario

With `MIGRATION_SCENARIO=era0` in every step, the v2 starts at era 1 with a new era clock and the v1 history becomes
era 0 (`scripts/migration/era0.js`). No contract changes:

- users, invitations, inspections, resources, offsets and certificates are kept, with the same ids and blocks;
- realized inspections and published resources move to era 0: they keep counting in the token impact, but cannot be
  voted on or give pool levels again. Open inspections stay open;
- the impact of the v1 eras is settled as era 0, and every user restarts the pool withdrawals at era 1;
- the pools start with their full allocation, and their v1 history is replaced by the era 0 payout.

`era0/config.json` sets the payout:

- `mode: "single"`: one era of each pool, split by the levels of v1 eras 1 and 2;
- `net: true`: each user's balance becomes v1 balance - tokens withdrawn from the v1 pools + era 0 payout (never below
  zero). Tokens that did not come from the pools are kept;
- `fundFrom` / `fundFull`: the pre-launch wallets of `era0/prelaunch-wallets.txt` fund the payout, in proportion to
  the tokens each one holds that did not come from the pools, after the `fundFull` wallets give all of theirs. The v2
  supply equals the v1 supply.

The `deploy` step saves the payout to `<addresses>.era0-payout.json`, to be published with the addresses.

Expected differences in this scenario, besides the ones above: the era fields of inspections, resources and users,
the pools, the balances of the users paid or funding the era 0, and the per-token values of
`RegenerationCreditImpact`. The `verify` step compares the deployment with the transformed snapshot, so it only
reports the common differences.

## Verifying a deployment

With the v2 addresses saved by the `deploy` step:

```bash
MIGRATION_SNAPSHOT=migration/snapshots/v1-3831863 MIGRATION_ADDRESSES=<addresses file> MIGRATION_STEP=verify \
  npx hardhat run --config scripts/migration/hardhat.mainnet.config.js --network mainnet scripts/migration/migrate.js
```

`migrator()` must return the zero address in every contract after the `close` step.
