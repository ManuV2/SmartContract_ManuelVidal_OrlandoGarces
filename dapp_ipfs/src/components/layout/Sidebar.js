// src/components/layout/Sidebar.js
import React from "react";

function Sidebar({ account, activeTab, onChangeTab }) {
  return (
    <aside
      style={{
        width: "260px",
        background:
          "linear-gradient(180deg, rgba(0,91,187,0.97) 0%, rgba(0,40,90,0.97) 100%)",
        color: "#ffffff",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        borderRadius: "0 16px 16px 0",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}
    >
      <div>
        <h1 style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>
          Sistema de consultas del club
        </h1>
        <p style={{ fontSize: "0.85rem", lineHeight: 1.4, opacity: 0.9 }}>
          Prototipo educativo de gobernanza consultiva basado en{" "}
          <strong>ERC20Votes + Governor + IPFS</strong>.
        </p>
      </div>

      <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>
        {account ? (
          <span>
            Conectado como <br />
            <code style={{ fontSize: "0.75rem" }}>{account}</code>
            <br />
            Red: Sepolia
          </span>
        ) : (
          <span>No conectado aún a MetaMask.</span>
        )}
      </div>

      <nav
        style={{
          marginTop: "0.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <button
          onClick={() => onChangeTab("council")}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            fontSize: "0.9rem",
            backgroundColor:
              activeTab === "council" ? "#ffffff" : "rgba(255,255,255,0.12)",
            color: activeTab === "council" ? "#005BBB" : "#ffffff",
          }}
        >
          Consejo del club
        </button>
        <button
          onClick={() => onChangeTab("voting")}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            fontSize: "0.9rem",
            backgroundColor:
              activeTab === "voting" ? "#ffffff" : "rgba(255,255,255,0.12)",
            color: activeTab === "voting" ? "#005BBB" : "#ffffff",
          }}
        >
          Votación de socios
        </button>
        <button
          onClick={() => onChangeTab("results")}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            fontSize: "0.9rem",
            backgroundColor:
              activeTab === "results" ? "#ffffff" : "rgba(255,255,255,0.12)",
            color: activeTab === "results" ? "#005BBB" : "#ffffff",
          }}
        >
          Consultar estado / acta
        </button>
      </nav>

      <div
        style={{
          marginTop: "auto",
          fontSize: "0.75rem",
          opacity: 0.8,
        }}
      >
        Demo académica – MUniCS
      </div>
    </aside>
  );
}

export default Sidebar;
