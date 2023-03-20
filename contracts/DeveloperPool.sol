// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <=0.9.0;

import "./PoolInterface.sol";
import "./SacTokenInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./types/DeveloperPoolTypes.sol";
import "./Blockable.sol";
import "./Callable.sol";

/**
 * @author Sintrop
 * @title DeveloperContract
 * @dev DeveloperPool is a contract to reward developers
 */
contract DeveloperPool is Ownable, Blockable, Callable {
  using SafeMath for uint256;

  uint256 public constant FIXED_POINT = 10**18;
  uint256 public constant TOKENS_PER_ERA = 833333000000000000000000;
  uint256 public constant ERAS = 18;

  SacTokenInterface internal sacToken;

  mapping(uint256 => Era) public eras;
  mapping(uint256 => mapping(address => uint256)) public developersLevel;
  mapping(uint256 => mapping(address => uint256)) public developersTokens;

  constructor(
    address sacTokenAddress,
    uint256 blocksPerEra,
    uint256 eraMax
  ) Blockable(blocksPerEra, eraMax) {
    sacToken = SacTokenInterface(sacTokenAddress);
  }

  function getEra(uint256 era) public view returns (Era memory) {
    return eras[era];
  }

  function withdraw(address delegate, uint256 era) public mustBeAllowedCaller {
    require(canApprove(era), "You can't withdraw yet");

    uint256 devTokens = tokens(era, delegate);

    if (devTokens == 0) return;

    eras[era].developers++;
    eras[era].tokens += devTokens;
    developersTokens[era][delegate] = devTokens;

    sacToken.transferWith(address(this), delegate, devTokens);
  }

  function balanceOf(address tokenOwner) public view returns (uint256) {
    return sacToken.balanceOf(tokenOwner);
  }

  function balance() public view returns (uint256) {
    return balanceOf(address(this));
  }

  function addLevel(address developer, uint256 developerLevel)
    public
    mustBeAllowedCaller
  {
    uint256 era = currentContractEra();

    uint256 levels = developersLevel[era][developer] == 0 ? developerLevel : 1;

    eras[era].levels = eras[era].levels.add(levels);
    developersLevel[era][developer] += levels;
  }

  function removeLevel(address developer) public mustBeAllowedCaller {
    uint256 era = currentContractEra();

    require(developersLevel[era][developer] != 0, "Not enough levels to remove");

    eras[era].levels = eras[era].levels.sub(1);
    developersLevel[era][developer]--;
  }

  function tokens(uint256 currentEra, address developer) internal view returns (uint256) {
    uint256 levels = eras[currentEra].levels;
    uint256 developerLevel = developersLevel[currentEra][developer];

    if (developerLevel == 0) return 0;

    return developerLevel.mul((TOKENS_PER_ERA.div(levels)));
  }
}
