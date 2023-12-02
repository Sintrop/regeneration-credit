const UserContract = artifacts.require("UserContract");

module.exports = function (deployer) {
  deployer.then(async () => {
    const INSPECTOR_PROPORTIONALITY = process.env["INSPECTOR_PROPORTIONALITY"];
    const ACTIVIST_PROPORTIONALITY = process.env["ACTIVIST_PROPORTIONALITY"];
    const RESEARCHER_PROPORTIONALITY = process.env["RESEARCHER_PROPORTIONALITY"];
    const DEVELOPER_PROPORTIONALITY = process.env["DEVELOPER_PROPORTIONALITY"];
    const VALIDATOR_PROPORTIONALITY = process.env["VALIDATOR_PROPORTIONALITY"];

    await deployer.deploy(UserContract,
      INSPECTOR_PROPORTIONALITY,
      ACTIVIST_PROPORTIONALITY,
      RESEARCHER_PROPORTIONALITY,
      DEVELOPER_PROPORTIONALITY,
      VALIDATOR_PROPORTIONALITY
    );
  });
};
