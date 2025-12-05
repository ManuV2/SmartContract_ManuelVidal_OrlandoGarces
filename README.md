# Sistema de Gobernanza Ponderada del Club

Este repositorio contiene el código desarrollado para las prácticas de la asignatura
“Tecnologías de Registro Distribuido y Blockchain” y el trabajo tutelado asociado.

## Arquitectura actual (Trabajo tutelado)

La versión final del proyecto se basa en:

- `contracts/ClubGovToken.sol`  
  Token ERC20Votes de gobernanza (OpenZeppelin 4.9.6).
- `contracts/ClubGovernor.sol`  
  Contrato Governor (quórum, periodos de votación, umbral de propuesta...).
- `contracts/ClubConsultationRegistry.sol`  
  Registro on-chain que asocia `proposalId` → CID de IPFS con el acta de resultado.

Flujo de una consulta:

1. El club crea una propuesta en `ClubGovernor`.
2. Los socios votan con peso ponderado.
3. Se genera un documento JSON con el acta de resultado y se sube a IPFS.
4. Se crea una segunda propuesta que registra el CID en `ClubConsultationRegistry` mediante `setResultDocument(proposalId, cid)`.
5. La dApp muestra tanto el estado on-chain de la propuesta como el documento IPFS.

## Código legado (Prácticas 1 y 2)

En la carpeta `legacy/` se conserva el contrato original de las prácticas 1 y 2:

- `legacy/DAOVotationSystem.sol`

Este contrato implementaba un sistema de votación ponderada ad hoc. En el trabajo
tutelado se ha migrado a una solución basada en OpenZeppelin Governor + ERC20Votes,
que resuelve las limitaciones detectadas (peso histórico, dependencia del owner, quórum, etc.).
