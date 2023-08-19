const timeMachine = require("ganache-time-traveler");

advanceBlock = async (blocksNumber) => {
  for (let i = 0; i < blocksNumber; i++) {
    await timeMachine.advanceBlock();
  }
};

beforeEach(async () => {
  let snapshot = await timeMachine.takeSnapshot();
  snapshotId = snapshot["result"];
})

afterEach(async () => {
  await timeMachine.revertToSnapshot(snapshotId);
})
