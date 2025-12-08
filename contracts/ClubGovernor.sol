// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Gobernanza basada en las implementaciones de OpenZeppelin (Governor + extensiones)
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.6/contracts/governance/Governor.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.6/contracts/governance/extensions/GovernorSettings.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.6/contracts/governance/extensions/GovernorCountingSimple.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.6/contracts/governance/extensions/GovernorVotes.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.6/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

/// @dev Interfaz mínima del registro donde se asocian propuestas con el CID de su acta.
interface IClubConsultationRegistry {
    function setResultDocument(uint256 proposalId, string calldata cid) external;
}

/// @title ClubGovernor
/// @notice Contrato de gobernanza del club: gestiona consultas, votos ponderados y estados de las propuestas.
/// @dev El registro de actas se realiza mediante propuestas técnicas que llaman a ClubConsultationRegistry.
contract ClubGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    /// @notice Contrato Registry que almacena el CID del acta asociado a cada proposalId.
    IClubConsultationRegistry public registry;

    constructor(IVotes _token, address _registry)
        Governor("ClubGovernor")
        // Parámetros de gobernanza (configuración pensada para entorno de pruebas)
        GovernorSettings(
            1,      // delay: 1 bloque (rápido para pruebas)
            20,     // periodo de votación: 20 bloques
            4       // umbral mínimo de votos para poder proponer
        )
        GovernorVotes(_token)
        // El quórum se fija en el 4% del total del poder de voto
        GovernorVotesQuorumFraction(4)
    {
        registry = IClubConsultationRegistry(_registry);
    }

    // Overrides requeridos por la herencia múltiple de los módulos de OpenZeppelin

    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(
        uint256 blockNumber
    )
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }
}
