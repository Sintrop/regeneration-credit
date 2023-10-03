const advanceBlock = async (blocksNumber) => {
  for (let i = 0; i < blocksNumber; i++) {
    let promise = new Promise((resolve, reject) => {
      web3.currentProvider.send(
        {
          jsonrpc: "2.0",
          method: "evm_mine",
          id: new Date().getTime(),
        },
        (err, result) => {
          if (err) {
            return reject(err);
          }
          const newBlockHash = web3.eth.getBlock("latest").hash;

          return resolve(newBlockHash);
        }
      );
    });
  }
};

module.exports = { advanceBlock };
