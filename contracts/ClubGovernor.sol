// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // Usa 0.8.20 en Remix para este contrato

// OpenZeppelin v4.9.6 imports por URL (RAW)
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.6/contracts/governance/Governor.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.6/contracts/governance/extensions/GovernorSettings.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.6/contracts/governance/extensions/GovernorCountingSimple.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.6/contracts/governance/extensions/GovernorVotes.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.6/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

/// @dev Interfaz mínima del registro de resultados (solo lo que vamos a usar vía Governor)
interface IClubConsultationRegistry {
    function setResultDocument(uint256 proposalId, string calldata cid) external;
}

/// @title ClubGovernor
/// @notice Governor basado en ERC20Votes, con quórum por fracción y parámetros configurables.
/// @dev La lógica de guardar CIDs se hace a través de propuestas que llaman a ClubConsultationRegistry.
contract ClubGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    /// @notice Contrato Registry donde se guardan los CIDs de resultado.
    IClubConsultationRegistry public registry;

    constructor(IVotes _token, address _registry)
        Governor("ClubGovernor")
        // votingDelay, votingPeriod, proposalThreshold
        GovernorSettings(
            1,      // delay: 1 bloque (rápido para pruebas)
            20,     // periodo de votación: 20 bloques
            4       // umbral mínimo de votos para poder proponer
        )
        GovernorVotes(_token)
        // quórum: 4% del total de votos
        GovernorVotesQuorumFraction(4)
    {
        registry = IClubConsultationRegistry(_registry);
    }

    // ============================================================
    // OVERRIDES requeridos por la herencia múltiple (OZ 4.9.6)
    // ============================================================

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
