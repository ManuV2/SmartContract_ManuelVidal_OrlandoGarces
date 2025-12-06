// src/components/TechnicalProposalPanel.js
import React from "react";

function TechnicalProposalPanel({
  cid,
  proposalId,
  txPending,
  createdProposalId,
  executeMessage,
  onCreateTechnical,
  onExecuteTechnical,
}) {
  return (
    <>
      {/* Propuesta técnica */}
      <section style={{ margin: "1.5rem 0" }}>
        <h2>2) Crear propuesta técnica en el Governor</h2>
        <p style={{ fontSize: "0.9rem", color: "#444" }}>
          Esta propuesta llamará a{" "}
          <code>setResultDocument(proposalIdOriginal, "ipfs://CID")</code>{" "}
          cuando se ejecute.
        </p>

        <button
          onClick={onCreateTechnical}
          disabled={txPending || !cid}
          style={{
            padding: "0.6rem 1.2rem",
            cursor: txPending || !cid ? "not-allowed" : "pointer",
            marginRight: "1rem",
          }}
        >
          {txPending
            ? "Creando propuesta en Governor..."
            : "2) Crear propuesta técnica con este CID"}
        </button>

        {createdProposalId && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              backgroundColor: "#e5ffe5",
              color: "#074d07",
              borderRadius: "8px",
              fontSize: "0.9rem",
            }}
          >
            <strong>Propuesta técnica creada en el Governor:</strong>{" "}
            {createdProposalId}
            <br />
            Revisa en Remix que <code>state(proposalIdTecnico)</code> pase a 4
            (Succeeded) antes de ejecutar el paso 3.
          </div>
        )}
      </section>

      {/* Ejecutar propuesta técnica */}
      <section>
        <h2>3) Ejecutar propuesta técnica</h2>
        <p style={{ fontSize: "0.9rem", color: "#444" }}>
          Cuando en Remix <code>state(proposalIdTecnico) == 4 (Succeeded)</code>
          , pulsa este botón para ejecutar la propuesta y escribir el CID en el
          Registry para el proposalId{" "}
          <code>{proposalId || "(indica el proposalId original)"}</code>.
        </p>

        <button
          onClick={onExecuteTechnical}
          disabled={txPending || !cid}
          style={{
            padding: "0.6rem 1.2rem",
            cursor: txPending || !cid ? "not-allowed" : "pointer",
          }}
        >
          {txPending
            ? "Ejecutando propuesta en Governor..."
            : "3) Ejecutar propuesta técnica en Governor"}
        </button>

        {executeMessage && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              backgroundColor: "#e5ffe5",
              color: "#074d07",
              borderRadius: "8px",
              fontSize: "0.9rem",
            }}
          >
            {executeMessage}
          </div>
        )}
      </section>
    </>
  );
}

export default TechnicalProposalPanel;
