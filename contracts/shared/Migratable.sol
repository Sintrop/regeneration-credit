// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @title Migratable
 * @author Sintrop
 * @notice Allows the state of a previous deployment to be imported once, before the contract starts operating.
 * @dev The deployer is the migrator. Migration functions only write the values read from the previous deployment
 * at a snapshot block, and `migrateLogs` emits the events of the previous deployment with their original topics
 * and data, so the history can be compared log by log. After `closeMigration`, every migration function is disabled
 * forever.
 */
contract Migratable {
  /// @notice Address allowed to import state. Zero after the migration is closed.
  address public migrator;

  /**
   * @dev Event log of the previous deployment.
   * @param topics Original log topics (event signature and indexed parameters).
   * @param data Original log data (non-indexed parameters).
   */
  struct MigrationLog {
    bytes32[] topics;
    bytes data;
  }

  constructor() {
    migrator = msg.sender;
  }

  /**
   * @notice Emits the events of the previous deployment, in their original order.
   * @param logs Logs with the original topics and data.
   */
  function migrateLogs(MigrationLog[] calldata logs) external onlyMigration {
    for (uint256 i = 0; i < logs.length; i++) {
      bytes32[] calldata topics = logs[i].topics;
      bytes memory data = logs[i].data;
      uint256 size = data.length;

      if (topics.length == 1) {
        bytes32 t0 = topics[0];
        assembly {
          log1(add(data, 32), size, t0)
        }
      } else if (topics.length == 2) {
        bytes32 t0 = topics[0];
        bytes32 t1 = topics[1];
        assembly {
          log2(add(data, 32), size, t0, t1)
        }
      } else if (topics.length == 3) {
        bytes32 t0 = topics[0];
        bytes32 t1 = topics[1];
        bytes32 t2 = topics[2];
        assembly {
          log3(add(data, 32), size, t0, t1, t2)
        }
      } else if (topics.length == 4) {
        bytes32 t0 = topics[0];
        bytes32 t1 = topics[1];
        bytes32 t2 = topics[2];
        bytes32 t3 = topics[3];
        assembly {
          log4(add(data, 32), size, t0, t1, t2, t3)
        }
      } else {
        revert("Invalid log");
      }
    }
  }

  /**
   * @notice Disables all migration functions forever.
   */
  function closeMigration() external onlyMigration {
    migrator = address(0);
    emit MigrationClosed();
  }

  modifier onlyMigration() {
    require(msg.sender == migrator, "Migration closed");
    _;
  }

  /// @notice Emitted when the migration is closed.
  event MigrationClosed();
}
