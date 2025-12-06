// src/components/CreateConsultationPanel.js
import React from "react";

function CreateConsultationPanel({
  title,
  question,
  optionsText,
  onChangeTitle,
  onChangeQuestion,
  onChangeOptionsText,
  onCreate,
  txPending,
  mainProposalId,
  canCreate,
}) {
  return (
    <section style={{ marginBottom: "2rem" }}>
      <h2>0) Crear nueva consulta en el Governor</h2>
      <p style={{ fontSize: "0.9rem", color: "#444" }}>
        Esta sección está pensada para el Consejo del club. Al crear una nueva
        consulta se genera una propuesta en el contrato{" "}
        <code>ClubGovernor</code> que permite abrir la votación ponderada para
        los socios.
      </p>

      <div style={{ marginTop: "1rem" }}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Título de la consulta:
            <input
              type="text"
              value={title}
              onChange={(e) => onChangeTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "0.4rem",
                marginTop: "0.25rem",
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Pregunta oficial:
            <textarea
              value={question}
              onChange={(e) => onChangeQuestion(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "0.4rem",
                marginTop: "0.25rem",
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Opciones de voto (una por línea):
            <textarea
              value={optionsText}
              onChange={(e) => onChangeOptionsText(e.target.value)}
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
          onClick={onCreate}
          disabled={!canCreate || txPending}
          style={{
            padding: "0.6rem 1.2rem",
            cursor: !canCreate || txPending ? "not-allowed" : "pointer",
            opacity: !canCreate ? 0.7 : 1,
          }}
        >
          {txPending
            ? "Creando consulta en Governor..."
            : "0) Crear consulta y abrir votación en Governor"}
        </button>
        {!canCreate && (
          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "0.8rem",
              color: "#aa0000",
            }}
          >
            Para crear la consulta debes indicar un título, una pregunta oficial
            y al menos dos opciones de voto.
          </p>
        )}

        {mainProposalId && (
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
            <strong>Consulta creada en el Governor.</strong>
            <br />
            ProposalId de la consulta:{" "}
            <code style={{ fontSize: "0.8rem" }}>{mainProposalId}</code>
            <br />
            Este identificador se ha copiado automáticamente en el campo{" "}
            <code>ProposalId</code> de la sección 1 para preparar el acta.
          </div>
        )}
      </div>
    </section>
  );
}

export default CreateConsultationPanel;
