// SPDX-License-Identifier: Unlicenced
pragma solidity 0.8.30;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract DAOVotationSystem {

    address public owner;
    event NewProposal(address creator, string description);
    event Vote(address voter, uint proposalId, bool positive);
    uint proposalCount;
    struct Proposal {
        uint id;
        address creator;
        string desciption;
        uint256 positiveVotes;
        uint256 negativeVotes;
        bool isActive;
        uint256 deadline;
    }
    mapping(uint => Proposal) public proposals;

    function _newProposal(address _creator, string memory _description) external {
        uint256 id = proposalCount++;
        proposals[id] = Proposal(id, _creator, _description, 0, 0, true, block.timestamp + 10 days);
        emit NewProposal(_creator, _description);
    }

    function vote(uint _proposalId, bool _positive) external {
        require(proposals[_proposalId].isActive, "Proposal is not active");
        require(block.timestamp < proposals[_proposalId].deadline, "Proposal has expired");
        if (_positive) {
            proposals[_proposalId].positiveVotes++;
        } else {
            proposals[_proposalId].negativeVotes++;
        }
        emit Vote(msg.sender, _proposalId, _positive);
    }
}