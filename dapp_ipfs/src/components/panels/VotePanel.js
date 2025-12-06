// src/components/VotePanel.js
import React, { useState } from "react";
import { ethers } from "ethers";

function VotePanel({ provider, governorAddress, governorAbi, governorStates }) {
  const [voteProposalId, setVoteProposalId] = useState("");
  const [voteMessage, setVoteMessage] = useState("");
  const [voteError, setVoteError] = useState("");
  const [voteState, setVoteState] = useState(null);
  const [votePending, setVotePending] = useState(false);

  const handleCheckVoteState = async () => {
    setVoteError("");
    setVoteMessage("");
    setVoteState(null);

    try {
      if (!provider) {
        throw new Error("Proveedor Ethereum no inicializado.");
      }
      if (!voteProposalId.trim()) {
        throw new Error(
          "Introduce un proposalId antes de consultar el estado."
        );
      }

      const signer = provider.getSigner();
      const governor = new ethers.Contract(
        governorAddress,
        governorAbi,
        signer
      );

      const proposalIdNum = ethers.BigNumber.from(voteProposalId);
      const st = await governor.state(proposalIdNum);

      setVoteState(Number(st));
    } catch (err) {
      console.error(err);
      setVoteError(
        err.message || "Error consultando el estado de la propuesta"
      );
    }
  };

  const handleCastVote = async (support) => {
    setVoteError("");
    setVoteMessage("");

    try {
      if (!provider) {
        throw new Error("Proveedor Ethereum no inicializado.");
      }
      if (!voteProposalId.trim()) {
        throw new Error("Introduce un proposalId antes de votar.");
      }

      setVotePending(true);

      const signer = provider.getSigner();
      const governor = new ethers.Contract(
        governorAddress,
        governorAbi,
        signer
      );

      const proposalIdNum = ethers.BigNumber.from(voteProposalId);
      const tx = await governor.castVote(proposalIdNum, support);
      await tx.wait();

      let label = "en contra";
      if (support === 1) label = "a favor";
      if (support === 2) label = "abstención";

      setVoteMessage(`Voto ${label} registrado correctamente en la propuesta.`);
    } catch (err) {
      console.error(err);
      let msg = err.message || "Error enviando el voto";

      if (msg.includes("vote not currently active")) {
        msg =
          "No se puede votar esta propuesta ahora mismo: el Governor indica que la votación no está activa (state != 1 - Active). " +
          "Comprueba que el proposalId es el de la consulta principal y que el periodo de votación está abierto.";
      }

      setVoteError(msg);
    } finally {
      setVotePending(false);
    }
  };

  const STATES = governorStates || [
    "0: Pending",
    "1: Active",
    "2: Canceled",
    "3: Defeated",
    "4: Succeeded",
    "5: Queued",
    "6: Expired",
    "7: Executed",
  ];

  return (
    <section>
      {/* ==========================
          VOTACIÓN DE SOCIOS
          ========================== */}
      <h2>4) Votación de socios (castVote)</h2>
      <p>
        Esta sección simula la pantalla que vería un socio: introduce el{" "}
        <code>proposalId</code> de una consulta y vota a favor, en contra o
        abstención. Internamente se llama a{" "}
        <code>castVote(proposalId, support)</code> del Governor.
      </p>

      <div style={{ marginBottom: "0.75rem" }}>
        <label>
          ProposalId a votar:
          <input
            type="text"
            value={voteProposalId}
            onChange={(e) => setVoteProposalId(e.target.value)}
            style={{ width: "100%", padding: "0.4rem", marginTop: "0.25rem" }}
            placeholder="Ej: proposalId de la consulta visible para el socio"
          />
        </label>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <button
          onClick={handleCheckVoteState}
          style={{ padding: "0.4rem 0.8rem", marginRight: "0.5rem" }}
        >
          Consultar estado on-chain
        </button>
        {voteState !== null && (
          <span style={{ marginLeft: "0.5rem" }}>
            Estado:{" "}
            <code>{STATES[voteState] ?? `${voteState}: desconocido`}</code>
          </span>
        )}
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <button
          onClick={() => handleCastVote(1)}
          disabled={votePending}
          style={{ padding: "0.5rem 1rem", marginRight: "0.5rem" }}
        >
          Votar A FAVOR
        </button>
        <button
          onClick={() => handleCastVote(0)}
          disabled={votePending}
          style={{ padding: "0.5rem 1rem", marginRight: "0.5rem" }}
        >
          Votar EN CONTRA
        </button>
        <button
          onClick={() => handleCastVote(2)}
          disabled={votePending}
          style={{ padding: "0.5rem 1rem" }}
        >
          ABSTENERSE
        </button>
      </div>

      {voteError && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.75rem",
            backgroundColor: "#ffe5e5",
            color: "#a33",
          }}
        >
          <strong>Error votación:</strong> {voteError}
        </div>
      )}

      {voteMessage && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.75rem",
            backgroundColor: "#e5ffe5",
            color: "#074d07",
          }}
        >
          {voteMessage}
        </div>
      )}
    </section>
  );
}

export default VotePanel;
