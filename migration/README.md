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

## Verifying a deployment

With the v2 addresses saved by the `deploy` step:

```bash
MIGRATION_SNAPSHOT=migration/snapshots/v1-3831863 MIGRATION_ADDRESSES=<addresses file> MIGRATION_STEP=verify \
  npx hardhat run --config scripts/migration/hardhat.mainnet.config.js --network mainnet scripts/migration/migrate.js
```

`migrator()` must return the zero address in every contract after the `close` step.
