// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// OpenZeppelin v4.9.6 importada por URL
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.6/contracts/token/ERC20/extensions/ERC20Votes.sol";

/// @title ClubGovToken
/// @notice Token de gobernanza basado en ERC20Votes (OpenZeppelin v4.9.6)
contract ClubGovToken is ERC20, ERC20Permit, ERC20Votes {
    constructor(uint256 initialSupply)
        ERC20("Club Governance Token", "CLUB")
        ERC20Permit("Club Governance Token")
    {
        // mint inicial al deployer
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    // ===== Overrides requeridos por ERC20Votes (v4.9) =====

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(
        address account,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
}
