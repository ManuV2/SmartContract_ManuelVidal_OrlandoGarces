// src/App.js
import React, { useEffect, useState } from "react";
import { create as createIpfsClient } from "kubo-rpc-client";
import { ethers } from "ethers";
import governorAbi from "./abi/ClubGovernor.abi.json";
import registryAbi from "./abi/ClubConsultationRegistry.abi.json";

const ipfs = createIpfsClient({
  url: "http://127.0.0.1:5001",
});

// ⚠️ RELLENA AQUÍ tus direcciones reales desplegadas en Sepolia
const GOVERNOR_ADDRESS = "0x36161B827D71f34a30D91249208F64D9c3B799e8";
const REGISTRY_ADDRESS = "0x528B38beD6f33753B43244979a957eF2e165ccB8";

const GOVERNOR_STATES = [
  "0: Pending",
  "1: Active",
  "2: Canceled",
  "3: Defeated",
  "4: Succeeded",
  "5: Queued",
  "6: Expired",
  "7: Executed",
];

function App() {
  // --- Estado IPFS / JSON (acta) ---
  const [proposalId, setProposalId] = useState("");
  const [title, setTitle] = useState(
    "Consulta sobre el topónimo en el nombre oficial del club"
  );
  const [question, setQuestion] = useState(
    "¿Prefiere mantener el nombre actual o cambiar a 'Real Club Deportivo da Coruña'?"
  );
  const [optionsText, setOptionsText] = useState(
    "Mantener el nombre actual\nCambiar a 'Real Club Deportivo da Coruña'"
  );
  const [notes, setNotes] = useState(
    "La consulta tiene carácter consultivo. El Consejo valorará el resultado en el marco de los estatutos."
  );

  const [cid, setCid] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [jsonPreview, setJsonPreview] = useState("");

  // --- Estado Ethereum / Governor ---
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState("");
  const [txError, setTxError] = useState("");
  const [txPending, setTxPending] = useState(false);
  const [createdProposalId, setCreatedProposalId] = useState("");
  const [executeMessage, setExecuteMessage] = useState("");

  // --- NUEVO: estado para “pantalla de socio” (votar) ---
  const [voteProposalId, setVoteProposalId] = useState("");
  const [voteMessage, setVoteMessage] = useState("");
  const [voteError, setVoteError] = useState("");
  const [voteState, setVoteState] = useState(null);

  // ============================
  //   Conexión inicial MetaMask
  // ============================
  useEffect(() => {
    async function initEthereum() {
      if (!window.ethereum) {
        setTxError("No se ha detectado MetaMask en el navegador.");
        return;
      }
      try {
        // Forzar Sepolia (0xaa36a7)
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }],
        });

        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        await web3Provider.send("eth_requestAccounts", []);
        const signer = web3Provider.getSigner();
        const addr = await signer.getAddress();

        setProvider(web3Provider);
        setAccount(addr);
      } catch (err) {
        console.error(err);
        setTxError("Error inicializando MetaMask / Sepolia: " + err.message);
      }
    }

    initEthereum();
  }, []);

  // ==================================
  //   Paso 1: Construir JSON y subir a IPFS
  // ==================================
  const handleUploadActa = async (e) => {
    e.preventDefault();
    setError("");
    setCid("");
    setJsonPreview("");
    setCreatedProposalId("");
    setExecuteMessage("");
    setTxError("");

    try {
      if (!proposalId.trim()) {
        throw new Error("Debes indicar el proposalId (del Governor).");
      }

      const options = optionsText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (options.length < 2) {
        throw new Error("Debes indicar al menos 2 opciones (una por línea).");
      }

      const nowIso = new Date().toISOString();

      const acta = {
        version: "1.0",
        club_name: "Real Club Deportivo de La Coruña",
        proposal_id: proposalId,
        title,
        question,
        options,
        opened_at: nowIso,
        closed_at: nowIso,
        results: {
          total_weight_supply: "0",
          votes_weight_option_1: "0",
          votes_weight_option_2: "0",
          participation_weight: "0",
          participation_ratio: 0,
          quorum_required_fraction: 0.04,
          quorum_met: false,
          winning_option_index: 0,
        },
        notes,
      };

      const actaString = JSON.stringify(acta, null, 2);
      setJsonPreview(actaString);

      setIsUploading(true);
      const added = await ipfs.add(actaString);
      const newCid = added.cid.toString();
      setCid(newCid);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al subir el acta a IPFS");
    } finally {
      setIsUploading(false);
    }
  };

  // ==========================================
  //   Paso 2: Crear propuesta técnica en Governor
  // ==========================================
  const handleCreateGovernanceProposal = async () => {
    setTxError("");
    setCreatedProposalId("");
    setExecuteMessage("");

    try {
      if (!provider) {
        throw new Error("Proveedor Ethereum no inicializado.");
      }
      if (!cid) {
        throw new Error("Primero genera y sube el acta a IPFS (CID vacío).");
      }
      if (!proposalId.trim()) {
        throw new Error("Debes indicar el proposalId de la consulta original.");
      }

      setTxPending(true);

      const signer = provider.getSigner();
      const governor = new ethers.Contract(
        GOVERNOR_ADDRESS,
        governorAbi,
        signer
      );

      const registryInterface = new ethers.utils.Interface(registryAbi);
      const proposalIdNum = ethers.BigNumber.from(proposalId);
      const cidString = `ipfs://${cid}`;

      const calldata = registryInterface.encodeFunctionData(
        "setResultDocument",
        [proposalIdNum, cidString]
      );

      const description = `Registrar acta de la consulta ${proposalId}`;
      const tx = await governor.propose(
        [REGISTRY_ADDRESS], // targets
        [0],                // values
        [calldata],         // calldatas
        description         // description
      );

      const receipt = await tx.wait();

      const event = receipt.events?.find(
        (e) => e.event === "ProposalCreated"
      );

      if (event && event.args && event.args.proposalId) {
        setCreatedProposalId(event.args.proposalId.toString());
      } else {
        setCreatedProposalId(
          "Propuesta creada, revisa en Remix/Etherscan el último ProposalCreated."
        );
      }
    } catch (err) {
      console.error(err);
      setTxError(err.message || "Error creando la propuesta en el Governor");
    } finally {
      setTxPending(false);
    }
  };

  // ==========================================
  //   Paso 3: Ejecutar la propuesta técnica
  // ==========================================
  const handleExecuteGovernanceProposal = async () => {
    setTxError("");
    setExecuteMessage("");

    try {
      if (!provider) {
        throw new Error("Proveedor Ethereum no inicializado.");
      }
      if (!cid) {
        throw new Error("CID vacío. Asegúrate de haber generado el acta.");
      }
      if (!proposalId.trim()) {
        throw new Error(
          "Debes indicar el proposalId ORIGINAL de la consulta (el mismo que usaste en el paso 1)."
        );
      }

      setTxPending(true);

      const signer = provider.getSigner();
      const governor = new ethers.Contract(
        GOVERNOR_ADDRESS,
        governorAbi,
        signer
      );

      const registryInterface = new ethers.utils.Interface(registryAbi);
      const proposalIdNum = ethers.BigNumber.from(proposalId);
      const cidString = `ipfs://${cid}`;

      const calldata = registryInterface.encodeFunctionData(
        "setResultDocument",
        [proposalIdNum, cidString]
      );

      const description = `Registrar acta de la consulta ${proposalId}`;
      const descriptionHash = ethers.utils.id(description);

      const tx = await governor.execute(
        [REGISTRY_ADDRESS], // targets
        [0],                // values
        [calldata],         // calldatas
        descriptionHash
      );

      await tx.wait();
      setExecuteMessage(
        "Propuesta técnica ejecutada en el Governor. Deberías poder leer el CID en getResultDocument(proposalIdOriginal)."
      );
    } catch (err) {
      console.error(err);
      setTxError(err.message || "Error ejecutando la propuesta en el Governor");
    } finally {
      setTxPending(false);
    }
  };

  // =========================================================
  //   NUEVO BLOQUE: Votación de socios (castVote desde dApp)
  // =========================================================
  const handleCheckVoteState = async () => {
    setVoteError("");
    setVoteMessage("");
    setVoteState(null);

    try {
      if (!provider) {
        throw new Error("Proveedor Ethereum no inicializado.");
      }
      if (!voteProposalId.trim()) {
        throw new Error("Introduce un proposalId para consultar su estado.");
      }

      const signer = provider.getSigner();
      const governor = new ethers.Contract(
        GOVERNOR_ADDRESS,
        governorAbi,
        signer
      );

      const proposalIdNum = ethers.BigNumber.from(voteProposalId);
      const st = await governor.state(proposalIdNum);
      setVoteState(st.toNumber());
    } catch (err) {
      console.error(err);
      setVoteError(err.message || "Error consultando el estado de la propuesta");
    }
  };

  const handleCastVote = async (support) => {
    // support: 0 = Against, 1 = For, 2 = Abstain
    setVoteError("");
    setVoteMessage("");

    try {
      if (!provider) {
        throw new Error("Proveedor Ethereum no inicializado.");
      }
      if (!voteProposalId.trim()) {
        throw new Error("Introduce un proposalId antes de votar.");
      }

      setTxPending(true);

      const signer = provider.getSigner();
      const governor = new ethers.Contract(
        GOVERNOR_ADDRESS,
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
      setVoteError(err.message || "Error enviando el voto");
    } finally {
      setTxPending(false);
    }
  };

  // ============================
  //           RENDER
  // ============================
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem" }}>
      <h1>Sistema de consultas del club</h1>
      <p>
        Prototipo de gobernanza consultiva basado en{" "}
        <strong>ERC20Votes + Governor + IPFS</strong>.
        <br />
        Esta dApp permite:
      </p>
      <ul>
        <li>Generar un JSON de acta y subirlo a IPFS.</li>
        <li>Crear y ejecutar una propuesta técnica que registra el CID en el Registry.</li>
        <li>Permitir que los socios voten propuestas desde una interfaz sencilla.</li>
      </ul>

      <div style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
        {account ? (
          <span>
            Conectado a MetaMask como <code>{account}</code> (Sepolia)
          </span>
        ) : (
          <span>No conectado aún a MetaMask.</span>
        )}
      </div>

      {/* ==========================
          SECCIÓN 1 – ACTA + IPFS
          ========================== */}
      <h2>1) Generar acta y subir a IPFS</h2>
      <form onSubmit={handleUploadActa} style={{ marginTop: "1rem" }}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            ProposalId (Governor) de la consulta original:
            <input
              type="text"
              value={proposalId}
              onChange={(e) => setProposalId(e.target.value)}
              style={{ width: "100%", padding: "0.4rem", marginTop: "0.25rem" }}
              placeholder="Ej: 3289... (proposalId de la consulta que quieres documentar)"
            />
          </label>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Título de la consulta:
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: "0.4rem", marginTop: "0.25rem" }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Pregunta:
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: "0.4rem", marginTop: "0.25rem" }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Opciones (una por línea):
            <textarea
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: "0.4rem", marginTop: "0.25rem" }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label>
            Notas:
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: "0.4rem", marginTop: "0.25rem" }}
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
          {isUploading ? "Subiendo acta a IPFS..." : "1) Construir acta y subir a IPFS"}
        </button>
      </form>

      {error && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            backgroundColor: "#ffe5e5",
            color: "#a33",
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
          }}
        >
          <div>
            <strong>CID generado:</strong> {cid}
          </div>
          <div style={{ marginTop: "0.25rem", fontSize: "0.9rem" }}>
            Se registrará on-chain como <code>ipfs://{cid}</code>.
          </div>
        </div>
      )}

      {jsonPreview && (
        <div style={{ marginTop: "1.5rem" }}>
          <h2>Previsualización del JSON de acta</h2>
          <pre
            style={{
              backgroundColor: "#f5f5f5",
              padding: "0.75rem",
              maxHeight: "300px",
              overflowY: "auto",
              fontSize: "0.85rem",
            }}
          >
            {jsonPreview}
          </pre>
        </div>
      )}

      <hr style={{ margin: "2rem 0" }} />

      {/* ==========================
          SECCIÓN 2 – PROPUESTA TÉCNICA
          ========================== */}
      <h2>2) Crear propuesta técnica en el Governor</h2>
      <p>
        Esta propuesta llamará a{" "}
        <code>setResultDocument(proposalIdOriginal, "ipfs://CID")</code> cuando
        se ejecute.
      </p>

      <button
        onClick={handleCreateGovernanceProposal}
        disabled={txPending || !cid}
        style={{
          padding: "0.6rem 1.2rem",
          cursor: txPending || !cid ? "not-allowed" : "pointer",
          marginRight: "1rem",
        }}
      >
        {txPending
          ? "Creando propuesta en Governor..."
          : "2) Crear propuesta en Governor con este CID"}
      </button>

      {createdProposalId && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            backgroundColor: "#e5ffe5",
            color: "#074d07",
          }}
        >
          <strong>Propuesta técnica creada en el Governor:</strong>{" "}
          {createdProposalId}
          <br />
          Revisa en Remix que <code>state(proposalIdTecnico)</code> pase a 4
          (Succeeded) antes de ejecutar el paso 3.
        </div>
      )}

      <hr style={{ margin: "2rem 0" }} />

      <h2>3) Ejecutar propuesta técnica</h2>
      <p>
        Cuando en Remix{" "}
        <code>state(proposalIdTecnico) == 4 (Succeeded)</code>, pulsa este
        botón para ejecutar la propuesta y escribir el CID en el Registry.
      </p>

      <button
        onClick={handleExecuteGovernanceProposal}
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

      {txError && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            backgroundColor: "#ffe5e5",
            color: "#a33",
          }}
        >
          <strong>Error Ethereum:</strong> {txError}
        </div>
      )}

      {executeMessage && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            backgroundColor: "#e5ffe5",
            color: "#074d07",
          }}
        >
          {executeMessage}
        </div>
      )}

      <hr style={{ margin: "2rem 0" }} />

      {/* ==========================
          SECCIÓN 4 – VOTACIÓN DE SOCIOS
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
            <code>
              {GOVERNOR_STATES[voteState] ?? `${voteState}: desconocido`}
            </code>
          </span>
        )}
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <button
          onClick={() => handleCastVote(1)}
          disabled={txPending}
          style={{ padding: "0.5rem 1rem", marginRight: "0.5rem" }}
        >
          Votar A FAVOR
        </button>
        <button
          onClick={() => handleCastVote(0)}
          disabled={txPending}
          style={{ padding: "0.5rem 1rem", marginRight: "0.5rem" }}
        >
          Votar EN CONTRA
        </button>
        <button
          onClick={() => handleCastVote(2)}
          disabled={txPending}
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
    </div>
  );
}

export default App;
