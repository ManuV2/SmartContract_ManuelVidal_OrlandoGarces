# Sistema de Gobernanza Ponderada del Club

Este repositorio contiene el código desarrollado para las prácticas de la asignatura  
**Tecnologías de Registro Distribuido y Blockchain** y para el **Trabajo Tutelado** asociado.

El proyecto implementa un sistema de consultas y votación ponderada inspirado en casos reales
de gobernanza en clubes deportivos, combinando smart contracts, una dApp web e IPFS.

---

## Arquitectura actual (Trabajo tutelado)

La versión final del proyecto se basa en los siguientes componentes:

- **`contracts/ClubGovToken.sol`**  
  Token de gobernanza basado en `ERC20Votes` (OpenZeppelin v4.9.6), que define el peso del voto.

- **`contracts/ClubGovernor.sol`**  
  Contrato Governor encargado de la creación de consultas, votación ponderada, quórum y estados
  de las propuestas.

- **`contracts/ClubConsultationRegistry.sol`**  
  Registro on-chain que asocia cada `proposalId` con el CID del acta de resultados almacenada en IPFS.

---

## Flujo de una consulta

1. El club crea una consulta mediante una propuesta en `ClubGovernor`.
2. Los socios votan utilizando un sistema de voto ponderado.
3. Se genera un documento JSON con el acta de resultados y se sube a IPFS.
4. Se crea una propuesta técnica que registra el CID en `ClubConsultationRegistry` mediante  
   `setResultDocument(proposalId, cid)`.
5. La dApp permite consultar tanto el estado on-chain de la propuesta como el acta almacenada en IPFS.

---

## Código legado (Prácticas 1 y 2)

En la carpeta **`legacy/`** se conserva el contrato desarrollado en las prácticas iniciales:

- **`legacy/DAOVotationSystem.sol`**

Este contrato implementaba un sistema de votación ponderada ad hoc.  
En el trabajo tutelado se ha migrado a una solución basada en **OpenZeppelin Governor + ERC20Votes**,
resolviendo limitaciones detectadas en las primeras prácticas (gestión del quórum, peso histórico
del voto, dependencia del owner, etc.).
