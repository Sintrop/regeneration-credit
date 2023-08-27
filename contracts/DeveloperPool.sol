// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import { PoolInterface } from "./PoolInterface.sol";
import { SacTokenInterface } from "./RegenerationCreditInterface.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { Blockable } from "./Blockable.sol";
import { Callable } from "./Callable.sol";
import { Poolable } from "./Poolable.sol";

/**
 * @author Sintrop
 * @title DeveloperContract
 * @dev DeveloperPool is a contract to reward developers
 */
contract DeveloperPool is Poolable, Ownable, Blockable, Callable {
  using SafeMath for uint256;

  uint256 public constant FIXED_POINT = 10 ** 18;
  uint256 public constant TOKENS_PER_ERA = 833333000000000000000000;
  uint256 public constant ERAS = 18;

  SacTokenInterface internal sacToken;

  constructor(address sacTokenAddress, uint256 blocksPerEra, uint256 eraMax) Blockable(blocksPerEra, eraMax) {
    sacToken = SacTokenInterface(sacTokenAddress);
  }

  function withdraw(address delegate, uint256 era) public mustBeAllowedCaller {
    require(canApprove(era), "You can't withdraw yet");

    uint256 devTokens = tokens(era, delegate, TOKENS_PER_ERA);

    if (devTokens == 0) return;

    eras[era].users++;
    eras[era].tokens += devTokens;
    eraTokens[era][delegate] = devTokens;

    sacToken.transferWith(address(this), delegate, devTokens);
  }

  function balanceOf(address tokenOwner) public view returns (uint256) {
    return sacToken.balanceOf(tokenOwner);
  }

  function balance() public view returns (uint256) {
    return balanceOf(address(this));
  }

  function addLevel(address developer, uint256 developerLevel, uint256 level) public mustBeAllowedCaller {
    uint256 era = currentContractEra();

    addPoolLevel(developer, developerLevel, level, era);
  }

  function removeLevel(address developer) public mustBeAllowedCaller {
    uint256 era = currentContractEra();

    removePoolLevel(developer, era);
  }
}
