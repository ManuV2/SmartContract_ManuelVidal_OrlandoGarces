// SPDX-License-Identifier: Unlicenced
pragma solidity 0.8.30;

contract DAOVotationSystem {
    // --- Owner manual ---
    address public owner;
    modifier onlyOwner(){ require(msg.sender == owner, "not owner"); _; }
    constructor(){ owner = msg.sender; }

    // --- Eventos ---
    event NewProposal(uint indexed id, address indexed creator, string description, uint256 deadline);
    event Vote(address indexed voter, uint indexed proposalId, bool positive, uint256 weight);
    event Closed(uint indexed proposalId, bool passed, uint256 positiveVotesWeight, uint256 negativeVotesWeight);

    uint256 public proposalCount;

    struct Proposal {
        uint id;
        address creator;
        string description;              // (fix de 'desciption')
        uint256 positiveVotes;           // no ponderado
        uint256 positiveVotesWeight;     // ponderado
        uint256 negativeVotes;
        uint256 negativeVotesWeight;
        bool isActive;
        uint256 deadline;                // timestamp límite
    }

    mapping(uint => Proposal) public proposals;                 // getter público
    mapping(uint => mapping(address => bool)) public hasVoted;  // (propuesta -> votante -> ya votó)
    mapping(address => uint256) public voteWeight;              // peso por votante

    // --------- ADMIN ---------
    function _setVoteWeight(address _voter, uint256 _weight) external onlyOwner {
        voteWeight[_voter] = _weight;
    }

    /// @notice Crea una propuesta con ventana de voto en segundos
    /// @param _creator Dirección que se mostrará como creador (puede ser owner)
    /// @param _description Texto de la propuesta
    /// @param _durationSeconds Ventana de votación en segundos (p.ej., 120 = 2 min)
    function _newProposal(address _creator, string memory _description, uint256 _durationSeconds) external onlyOwner {
        require(bytes(_description).length > 0, "empty description");
        require(_durationSeconds > 0, "bad duration");

        uint id = proposalCount++;
        proposals[id] = Proposal({
            id: id,
            creator: _creator,
            description: _description,
            positiveVotes: 0,
            positiveVotesWeight: 0,
            negativeVotes: 0,
            negativeVotesWeight: 0,
            isActive: true,
            deadline: block.timestamp + _durationSeconds
        });

        emit NewProposal(id, _creator, _description, proposals[id].deadline);
    }

    // --------- VOTO (ponderado) ---------
    function vote(uint _proposalId, bool _positive) external {
        require(_proposalId < proposalCount, "invalid proposal");
        Proposal storage p = proposals[_proposalId];
        require(p.isActive, "Proposal is not active");
        require(block.timestamp < p.deadline, "Proposal has expired");
        require(!hasVoted[_proposalId][msg.sender], "You have already voted on this proposal");

        uint256 weight = voteWeight[msg.sender];
        require(weight >= 1, "You have not weight to vote");

        hasVoted[_proposalId][msg.sender] = true;

        if (_positive) {
            unchecked { p.positiveVotes++; }
            p.positiveVotesWeight += weight;
        } else {
            unchecked { p.negativeVotes++; }
            p.negativeVotesWeight += weight;
        }

        emit Vote(msg.sender, _proposalId, _positive, weight);
    }

    // --------- CIERRE ---------
    function closeProposal(uint _proposalId) external onlyOwner {
        require(_proposalId < proposalCount, "invalid proposal");
        Proposal storage p = proposals[_proposalId];
        require(p.isActive, "Already closed");
        require(block.timestamp >= p.deadline, "Still active");
        p.isActive = false;

        bool passed = p.positiveVotesWeight > p.negativeVotesWeight;
        emit Closed(_proposalId, passed, p.positiveVotesWeight, p.negativeVotesWeight);
    }

    // Hora actual on-chain
    function nowTs() external view returns (uint256) {
        return block.timestamp;
    }
}
