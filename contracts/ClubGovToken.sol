// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Implementación de ERC20 con capacidad de voto delegado (ERC20Votes, OpenZeppelin)
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.6/contracts/token/ERC20/extensions/ERC20Votes.sol";

/// @title ClubGovToken
/// @notice Token de gobernanza del club, basado en ERC20Votes para habilitar voto ponderado y delegación.
contract ClubGovToken is ERC20, ERC20Permit, ERC20Votes {
    constructor(uint256 initialSupply)
        ERC20("Club Governance Token", "CLUB")
        ERC20Permit("Club Governance Token")
    {
        // Asigna todo el suministro inicial al desplegador del contrato
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

   // Overrides requeridos por la herencia múltiple de ERC20 y ERC20Votes

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
