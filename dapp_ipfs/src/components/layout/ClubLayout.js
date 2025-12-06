// src/components/layout/ClubLayout.js
import React from "react";
import Sidebar from "./Sidebar";

function ClubLayout({ account, activeTab, onChangeTab, children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        position: "relative",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Fondo Riazor */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "url('/riazor-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "grayscale(0.4)",
          zIndex: -2,
        }}
      />

      {/* Overlay oscuro azulón */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "linear-gradient(to right, rgba(0,18,51,0.9), rgba(0,18,51,0.6))",
          zIndex: -1,
        }}
      />

      {/* Sidebar */}
      <Sidebar
        account={account}
        activeTab={activeTab}
        onChangeTab={onChangeTab}
      />

      {/* Contenido principal */}
      <main
        style={{
          flex: 1,
          maxWidth: "1100px",
          margin: "1.5rem auto",
          padding: "1.25rem 1.5rem",
          backgroundColor: "rgba(255,255,255,0.96)",
          borderRadius: "16px",
          boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
          backdropFilter: "blur(6px)",
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default ClubLayout;
