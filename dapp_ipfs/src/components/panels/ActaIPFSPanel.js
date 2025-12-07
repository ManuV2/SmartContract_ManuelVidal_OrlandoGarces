// src/components/ActaIPFSPanel.js
import React from "react";

function ActaIPFSPanel({
  proposalId,
  notes,
  onChangeProposalId,
  onChangeNotes,
  onSubmitActa,
  isUploading,
  error,
  cid,
  jsonPreview,
  actaSummary,
}) {
  return (
    <section>
      <h2>1) Generar acta y subir a IPFS</h2>
      <form onSubmit={onSubmitActa} style={{ marginTop: "1rem" }}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            ProposalId (Governor) de la consulta original:
            <input
              type="text"
              value={proposalId}
              onChange={(e) => onChangeProposalId(e.target.value)}
              style={{
                width: "100%",
                padding: "0.4rem",
                marginTop: "0.25rem",
              }}
              placeholder="Ej: proposalId de la consulta que quieres documentar"
            />
          </label>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Notas:
            <textarea
              value={notes}
              onChange={(e) => onChangeNotes(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "0.4rem",
                marginTop: "0.25rem",
              }}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isUploading}
          style={{
            padding: "0.6rem 1.2rem",
            cursor: isUploading ? "not-allowed" : "pointer",
          }}
        >
          {isUploading
            ? "Subiendo acta a IPFS..."
            : "1) Construir acta y subir a IPFS"}
        </button>
      </form>

      {error && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            backgroundColor: "#ffe5e5",
            color: "#a33",
            borderRadius: "8px",
            fontSize: "0.9rem",
          }}
        >
          <strong>Error IPFS:</strong> {error}
        </div>
      )}

      {cid && (
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
          <div>
            <strong>CID generado:</strong> {cid}
          </div>
          <div style={{ marginTop: "0.25rem", fontSize: "0.85rem" }}>
            Se registrará on-chain como <code>ipfs://{cid}</code> para el
            proposalId <code>{proposalId}</code>.
          </div>
        </div>
      )}

      {actaSummary && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "0.9rem",
            backgroundColor: "#f5f7ff",
            borderRadius: "8px",
            fontSize: "0.9rem",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
            Resumen del acta
          </h3>
          <p style={{ margin: "0 0 0.5rem 0" }}>
            <strong>Título:</strong> {actaSummary.title}
            <br />
            <strong>Pregunta:</strong> {actaSummary.question}
          </p>
          <p style={{ margin: "0 0 0.5rem 0" }}>
            <strong>Opción ganadora:</strong>{" "}
            {actaSummary.options[actaSummary.winningIndex] ||
              actaSummary.options[0] ||
              "(sin determinar)"}
          </p>
          <p style={{ margin: "0 0 0.25rem 0" }}>
            <strong>Votos ponderados a favor:</strong> {actaSummary.forVotes}
            <br />
            <strong>Votos ponderados en contra:</strong>{" "}
            {actaSummary.againstVotes}
            <br />
            <strong>Abstenciones (peso):</strong> {actaSummary.abstainVotes}
            <br />
            <strong>Participación total (peso):</strong>{" "}
            {actaSummary.participationWeight}
          </p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#555" }}>
            Los pesos se obtienen directamente de los votos del contrato
            Governor en Sepolia.
          </p>
        </div>
      )}

      {jsonPreview && (
        <div style={{ marginTop: "1.5rem" }}>
          <details>
            <summary
              style={{
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              Ver JSON técnico del acta (solo auditoría)
            </summary>
            <pre
              style={{
                marginTop: "0.5rem",
                backgroundColor: "#f5f5f5",
                padding: "0.75rem",
                maxHeight: "260px",
                overflowY: "auto",
                fontSize: "0.85rem",
                borderRadius: "8px",
              }}
            >
              {jsonPreview}
            </pre>
          </details>
        </div>
      )}
    </section>
  );
}

export default ActaIPFSPanel;
