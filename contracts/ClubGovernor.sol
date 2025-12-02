// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// OpenZeppelin v4.9.6 imports por URL
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.6/contracts/governance/Governor.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.6/contracts/governance/extensions/GovernorSettings.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.6/contracts/governance/extensions/GovernorCountingSimple.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.6/contracts/governance/extensions/GovernorVotes.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.6/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

contract ClubGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    constructor(IVotes _token)
        Governor("ClubGovernor")
        // votingDelay, votingPeriod, proposalThreshold
        GovernorSettings(
            1,      // 1 bloque de delay
            20,     // ~1 semana (para pruebas luego lo bajamos)
            4       // umbral mínimo para proponer (0 = cualquiera con votos)
        )
        GovernorVotes(_token)
        // porcentaje de quórum (ej. 10% del supply)
        GovernorVotesQuorumFraction(4)
    {}

    // ===== Overrides requeridos por herencia múltiple (v4.9) =====

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
