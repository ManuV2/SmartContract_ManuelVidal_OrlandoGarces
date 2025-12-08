// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v4.9.6/contracts/access/Ownable.sol";

/// @title Registro de actas de consultas
/// @notice Asocia cada proposalId del Governor con el CID del acta de resultados almacenada en IPFS.

contract ClubConsultationRegistry is Ownable {
    // Relación entre una propuesta del Governor y el acta de resultados en IPFS
    mapping(uint256 => string) private _resultDocCid;

    event ResultDocumentSet(uint256 indexed proposalId, string cid);

    /// @notice Establece el CID de resultado para una propuesta concreta.
    /// @dev Solo puede llamarlo el owner (que será el Governor).
    function setResultDocument(uint256 proposalId, string calldata cid) external onlyOwner {
        require(bytes(cid).length > 0, "CID vacio");
        _resultDocCid[proposalId] = cid;
        emit ResultDocumentSet(proposalId, cid);
    }

    /// @notice Devuelve el CID de resultado asociado a una propuesta.
    function getResultDocument(uint256 proposalId) external view returns (string memory) {
        return _resultDocCid[proposalId];
    }
}
