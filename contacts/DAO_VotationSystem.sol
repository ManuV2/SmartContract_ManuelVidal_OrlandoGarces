// SPDX-License-Identifier: Unlicenced
pragma solidity 0.8.30;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract DAOVotationSystem {

    address public owner;
    event NewProposal(address creator, string description);
    event Vote(address voter, uint proposalId, bool positive, uint256 weight);

    uint proposalCount;
    struct Proposal {
        uint id;
        address creator;
        string desciption;
        uint256 positiveVotes;
        uint256 positiveVotesWeight;
        uint256 negativeVotes;
        uint256 negativeVotesWeight;
        bool isActive;
        uint256 deadline;
    }
    mapping(uint => Proposal) public proposals; //mapeado de propuestas
    mapping(uint => mapping(address => bool)) public hasVoted; //mapeado para comprobar si se ha votado en esta propuesta
    mapping(address => uint256) public voteWeight; //mapeado de peso de voto de cada votante

    // Asignar peso a un usuario (solo owner)
    function _setVoteWeight(address _voter, uint256 _weight) external {
        voteWeight[_voter] = _weight;
    }

     // Función para consultar el peso de un usuario
    function _getVoteWeight(address _voter) external view returns (uint256) {
        return voteWeight[_voter];

    }

    function _newProposal(address _creator, string memory _description) external {
        uint256 id = proposalCount++;
        proposals[id] = Proposal(id, _creator, _description, 0, 0, 0, 0, true, block.timestamp + 10 days);
        emit NewProposal(_creator, _description);
    }

    function vote(uint _proposalId, bool _positive) external {
        require(proposals[_proposalId].isActive, "Proposal is not active");//comprueba que la propuesta está activa
        require(block.timestamp < proposals[_proposalId].deadline, "Proposal has expired");//comprueba que el tiempo de la propuesta no ha expirado
        require(!hasVoted[_proposalId][msg.sender], "You have already voted on this proposal");//Comprueba que el votante ya ha votado la propuesta
        hasVoted[_proposalId][msg.sender] = true; // indicamos que el votante ya ha votado la propuesta

        uint256 weight = voteWeight[msg.sender];
        require(weight >= 1, "You have not weight to vote");//comprueba que el usuario tiene peso de voto

        if (_positive) {
            proposals[_proposalId].positiveVotes++; //Conteo de veces votad
            proposals[_proposalId].positiveVotesWeight += weight;
        } else {
            proposals[_proposalId].negativeVotes++;
            proposals[_proposalId].negativeVotesWeight += weight;
        }
        emit Vote(msg.sender, _proposalId, _positive, weight);
    }
}