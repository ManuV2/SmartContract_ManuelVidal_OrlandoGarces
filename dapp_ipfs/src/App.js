// src/App.js
import React, { useEffect, useState } from "react";
import { create as createIpfsClient } from "kubo-rpc-client";
import { ethers } from "ethers";
import governorAbi from "./abi/ClubGovernor.abi.json";
import registryAbi from "./abi/ClubConsultationRegistry.abi.json";
import VotePanel from "./components/panels/VotePanel";
import CreateConsultationPanel from "./components/panels/CreateConsultationPanel";
import ActaIPFSPanel from "./components/panels/ActaIPFSPanel";
import TechnicalProposalPanel from "./components/panels/TechnicalProposalPanel";
import ClubLayout from "./components/layout/ClubLayout";

const ipfs = createIpfsClient({
  url: "http://127.0.0.1:5001",
});

// Direcciones reales desplegadas en Sepolia
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
  // --- Navegación / pestañas ---
  const [activeTab, setActiveTab] = useState("council"); // 'council' | 'voting' | 'results'

  // --- Estado IPFS / JSON (acta) ---
  const [proposalId, setProposalId] = useState("");

  // Campos inicialmente vacíos
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [optionsText, setOptionsText] = useState("");

  const [notes, setNotes] = useState(
    "La consulta tiene carácter consultivo. El Consejo valorará el resultado en el marco de los estatutos."
  );

  const [cid, setCid] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [jsonPreview, setJsonPreview] = useState("");
  const [actaSummary, setActaSummary] = useState(null);

  // --- Estado Ethereum / Governor ---
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState("");
  const [txError, setTxError] = useState("");
  const [txPending, setTxPending] = useState(false);
  const [createdProposalId, setCreatedProposalId] = useState(""); // propuesta técnica
  const [executeMessage, setExecuteMessage] = useState("");
  const [mainProposalId, setMainProposalId] = useState(""); // propuesta principal creada desde la dApp

  // --- Pantalla de resultados ---
  const [resultProposalId, setResultProposalId] = useState("");
  const [resultState, setResultState] = useState(null);
  const [resultCid, setResultCid] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [resultError, setResultError] = useState("");

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

  // =========================================================
  //   Crear consulta principal en el Governor (Consejo)
  // =========================================================
  const handleCreateMainConsultation = async () => {
    setTxError("");
    setMainProposalId("");
    setCreatedProposalId("");
    setExecuteMessage("");

    try {
      if (!provider) {
        throw new Error("Proveedor Ethereum no inicializado.");
      }

      if (!title.trim()) {
        throw new Error("El título de la consulta es obligatorio.");
      }

      if (!question.trim()) {
        throw new Error("La pregunta oficial de la consulta es obligatoria.");
      }

      const options = optionsText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (options.length < 2) {
        throw new Error(
          "Debes indicar al menos 2 opciones de voto (una por línea)."
        );
      }

      const descriptionLines = [
        `Consulta oficial del club: ${title}`,
        "",
        `Pregunta: ${question}`,
        "",
        "Opciones:",
        ...options.map((opt, idx) => `- Opción ${idx + 1}: ${opt}`),
      ];
      const description = descriptionLines.join("\n");

      setTxPending(true);

      const signer = provider.getSigner();
      const governor = new ethers.Contract(
        GOVERNOR_ADDRESS,
        governorAbi,
        signer
      );

      const proposerAddress = await signer.getAddress();

      // Acción "dummy" sin efectos: llamar a nuestra propia dirección (EOA) sin datos
      const targets = [proposerAddress];
      const values = [0];
      const calldatas = ["0x"];

      const tx = await governor.propose(
        targets,
        values,
        calldatas,
        description
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find((e) => e.event === "ProposalCreated");

      if (event && event.args && event.args.proposalId) {
        const pid = event.args.proposalId.toString();

        // Identificador de la consulta principal
        setMainProposalId(pid);

        // Lo copiamos al campo de acta
        setProposalId(pid);

        // Limpiamos cualquier rastro de acta/propuesta técnica anterior
        setCid("");
        setJsonPreview("");
        setError("");
        setCreatedProposalId("");
        setExecuteMessage("");
      } else {
        setMainProposalId(
          "Consulta creada, revisa el último ProposalCreated en Remix/Etherscan."
        );
      }
    } catch (err) {
      console.error(err);
      setTxError(err.message || "Error creando la consulta en el Governor");
    } finally {
      setTxPending(false);
    }
  };

  // ==================================
  //   1) Construir JSON y subir a IPFS
  // ==================================
  const handleUploadActa = async (e) => {
    e.preventDefault();

    // Reset de estados previos
    setError("");
    setCid("");
    setJsonPreview("");
    setCreatedProposalId("");
    setExecuteMessage("");
    setTxError("");
    setActaSummary(null);

    try {
      if (!proposalId.trim()) {
        throw new Error("Debes indicar el proposalId (del Governor).");
      }

      if (!provider) {
        throw new Error(
          "Proveedor Ethereum no inicializado. Asegúrate de tener MetaMask conectado."
        );
      }

      const options = optionsText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (options.length < 2) {
        throw new Error("Debes indicar al menos 2 opciones (una por línea).");
      }

      const nowIso = new Date().toISOString();

      // ============================
      // Leer votos reales del Governor
      // ============================
      const governor = new ethers.Contract(
        GOVERNOR_ADDRESS,
        governorAbi,
        provider
      );

      const proposalIdNum = ethers.BigNumber.from(proposalId);

      let againstVotes = ethers.BigNumber.from(0);
      let forVotes = ethers.BigNumber.from(0);
      let abstainVotes = ethers.BigNumber.from(0);

      try {
        const votes = await governor.proposalVotes(proposalIdNum);
        // En ethers v5, viene como array.
        againstVotes = votes.againstVotes ?? votes[0];
        forVotes = votes.forVotes ?? votes[1];
        abstainVotes = votes.abstainVotes ?? votes[2];
      } catch (errVotes) {
        console.warn(
          "No se pudieron leer los votos del Governor, se usarán 0 por defecto.",
          errVotes
        );
      }

      const participationWeight = againstVotes.add(forVotes).add(abstainVotes);

      // Ganadora básica: comparamos a favor vs en contra
      // (asumimos que options[0] = "sí / a favor", options[1] = "no / en contra")
      let winningIndex = 0;
      if (againstVotes.gt(forVotes)) {
        winningIndex = 1;
      }
      // Si empatan, dejamos 0.

      // ============================
      // Construir acta con resultados reales
      // ============================
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
          // usamos solo los valores que podemos calcular de forma fiable.
          total_weight_supply: "desconocido",
          votes_weight_option_1: forVotes.toString(),
          votes_weight_option_2: againstVotes.toString(),
          participation_weight: participationWeight.toString(),
          participation_ratio: 0, // opcional: puedes dejarlo como 0 o calcularlo en el futuro
          quorum_required_fraction: 0.04,
          quorum_met: false, // igual: puedes mejorarlo si más adelante calculas quórum real
          winning_option_index: winningIndex,
        },
        notes,
      };
      setActaSummary({
        title,
        question,
        options,
        forVotes: forVotes.toString(),
        againstVotes: againstVotes.toString(),
        abstainVotes: abstainVotes.toString(),
        participationWeight: participationWeight.toString(),
        winningIndex,
      });

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
  //   2) Crear propuesta técnica en Governor
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

      // Comprobar coherencia acta - proposalId
      if (jsonPreview) {
        try {
          const parsed = JSON.parse(jsonPreview);
          if (parsed.proposal_id && parsed.proposal_id !== proposalId) {
            throw new Error(
              `El acta cargada pertenece al proposalId ${parsed.proposal_id}, ` +
                `pero estás intentando registrar el proposalId ${proposalId}. ` +
                `Vuelve a generar el acta (paso 1) para esta consulta.`
            );
          }
        } catch (e) {
          console.warn("No se ha podido validar jsonPreview:", e);
        }
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
        [REGISTRY_ADDRESS],
        [0],
        [calldata],
        description
      );

      const receipt = await tx.wait();

      const event = receipt.events?.find((e) => e.event === "ProposalCreated");

      if (event && event.args && event.args.proposalId) {
        setCreatedProposalId(event.args.proposalId.toString());
      } else {
        setCreatedProposalId(
          "Propuesta creada, revisa en Remix/Etherscan el último ProposalCreated."
        );
      }
    } catch (err) {
      console.error(err);
      let msg = err.message || "Error creando la propuesta en el Governor";

      if (msg.includes("proposal already exists")) {
        msg =
          "El Governor indica que ya existe una propuesta técnica con estos mismos parámetros " +
          "(mismo proposalId original, mismo calldata y misma descripción). " +
          "Utiliza esa propuesta ya creada o cambia ligeramente la descripción si quieres generar otra nueva.";
      }

      setTxError(msg);
    } finally {
      setTxPending(false);
    }
  };

  // ==========================================
  //   3) Ejecutar la propuesta técnica
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
        [REGISTRY_ADDRESS],
        [0],
        [calldata],
        descriptionHash
      );

      await tx.wait();
      setExecuteMessage(
        "Propuesta técnica ejecutada en el Governor. Deberías poder leer el CID en getResultDocument(proposalIdOriginal)."
      );
    } catch (err) {
      console.error(err);
      let msg =
        err.message || "Error ejecutando la propuesta técnica en el Governor";

      // Mensaje cuando aún no es 'Succeeded'
      if (msg.includes("proposal not successful")) {
        msg =
          "El Governor indica que la propuesta técnica todavía no está en estado 4 (Succeeded) o ya no es ejecutable (expirada / ejecutada). " +
          "Revisa en Remix que state(proposalIdTecnico) == 4 antes de pulsar este botón.";
      }

      setTxError(msg);
    } finally {
      setTxPending(false);
    }
  };

  // =========================================================
  //   BLOQUE: Consulta de resultados / acta
  // =========================================================
  const handleCheckProposalInfo = async () => {
    setResultError("");
    setResultMessage("");
    setResultCid("");
    setResultState(null);

    try {
      if (!provider) {
        throw new Error("Proveedor Ethereum no inicializado.");
      }
      if (!resultProposalId.trim()) {
        throw new Error("Introduce un proposalId para consultar.");
      }

      const signer = provider.getSigner();
      const governor = new ethers.Contract(
        GOVERNOR_ADDRESS,
        governorAbi,
        signer
      );
      const registry = new ethers.Contract(
        REGISTRY_ADDRESS,
        registryAbi,
        signer
      );

      const id = ethers.BigNumber.from(resultProposalId);

      const st = await governor.state(id);
      setResultState(Number(st));

      const cidFromRegistry = await registry.getResultDocument(id);
      if (cidFromRegistry && cidFromRegistry.length > 0) {
        setResultCid(cidFromRegistry);
        setResultMessage(
          "Esta consulta tiene un acta registrada en el Registry."
        );
      } else {
        setResultMessage(
          "Todavía no hay acta registrada en el Registry para esta consulta."
        );
      }
    } catch (err) {
      console.error(err);
      setResultError(err.message || "Error consultando la propuesta");
    }
  };
  // ============================
  //   Validación formulario de consulta
  // ============================
  const hasTitle = title.trim().length > 0;
  const hasQuestion = question.trim().length > 0;

  const optionLines = optionsText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const hasEnoughOptions = optionLines.length >= 2;

  // Solo permitimos crear la consulta si hay título, pregunta y al menos 2 opciones
  const canCreateConsultation = hasTitle && hasQuestion && hasEnoughOptions;

  // ============================
  //           RENDER
  // ============================
  return (
    <ClubLayout
      account={account}
      activeTab={activeTab}
      onChangeTab={setActiveTab}
    >
      {txError && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem",
            backgroundColor: "#ffe5e5",
            color: "#a33",
            borderRadius: "8px",
            fontSize: "0.9rem",
          }}
        >
          <strong>Error Ethereum:</strong> {txError}
        </div>
      )}

      {/* === PESTAÑA CONSEJO === */}
      {activeTab === "council" && (
        <>
          <CreateConsultationPanel
            title={title}
            question={question}
            optionsText={optionsText}
            onChangeTitle={setTitle}
            onChangeQuestion={setQuestion}
            onChangeOptionsText={setOptionsText}
            onCreate={handleCreateMainConsultation}
            txPending={txPending}
            mainProposalId={mainProposalId}
            canCreate={canCreateConsultation}
          />

          <hr style={{ margin: "1.5rem 0" }} />

          <ActaIPFSPanel
            proposalId={proposalId}
            notes={notes}
            onChangeProposalId={setProposalId}
            onChangeNotes={setNotes}
            onSubmitActa={handleUploadActa}
            isUploading={isUploading}
            error={error}
            cid={cid}
            jsonPreview={jsonPreview}
            actaSummary={actaSummary}
          />

          <hr style={{ margin: "1.5rem 0" }} />

          <TechnicalProposalPanel
            cid={cid}
            proposalId={proposalId}
            txPending={txPending}
            createdProposalId={createdProposalId}
            executeMessage={executeMessage}
            onCreateTechnical={handleCreateGovernanceProposal}
            onExecuteTechnical={handleExecuteGovernanceProposal}
          />
        </>
      )}

      {/* === PESTAÑA VOTACIÓN SOCIOS === */}
      {activeTab === "voting" && (
        <section>
          <VotePanel
            provider={provider}
            governorAddress={GOVERNOR_ADDRESS}
            governorAbi={governorAbi}
            governorStates={GOVERNOR_STATES}
          />
        </section>
      )}

      {/* === PESTAÑA CONSULTA RESULTADOS === */}
      {activeTab === "results" && (
        <section>
          <h2>5) Consultar estado y acta de una consulta</h2>
          <p style={{ fontSize: "0.9rem", color: "#444" }}>
            Introduce el <code>proposalId</code> de una consulta para ver su
            estado on-chain y, si existe, el enlace al acta oficial registrada
            en IPFS mediante el Registry.
          </p>

          <div style={{ marginTop: "1rem", marginBottom: "0.75rem" }}>
            <label>
              ProposalId de la consulta:
              <input
                type="text"
                value={resultProposalId}
                onChange={(e) => setResultProposalId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.4rem",
                  marginTop: "0.25rem",
                }}
                placeholder="Ej: proposalId de la consulta principal"
              />
            </label>
          </div>

          <button
            onClick={handleCheckProposalInfo}
            style={{ padding: "0.5rem 1rem" }}
          >
            Consultar información
          </button>

          {(resultState !== null || resultMessage || resultCid) && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                backgroundColor: "#f5f7ff",
                borderRadius: "8px",
                fontSize: "0.9rem",
              }}
            >
              {resultState !== null && (
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>Estado en el Governor:</strong>{" "}
                  <code>
                    {GOVERNOR_STATES[resultState] ??
                      `${resultState}: desconocido`}
                  </code>
                </div>
              )}

              {resultMessage && (
                <div style={{ marginBottom: "0.5rem" }}>{resultMessage}</div>
              )}

              {resultCid && (
                <div>
                  <strong>CID registrado en Registry:</strong>{" "}
                  <code style={{ fontSize: "0.8rem" }}>{resultCid}</code>
                  <br />
                  <span style={{ fontSize: "0.85rem" }}>
                    Puedes abrir el acta en un gateway público, por ejemplo:
                    <br />
                    <a
                      href={`https://ipfs.io/ipfs/${resultCid.replace(
                        "ipfs://",
                        ""
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      https://ipfs.io/ipfs/
                      {resultCid.replace("ipfs://", "")}
                    </a>
                  </span>
                </div>
              )}
            </div>
          )}

          {resultError && (
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.75rem",
                backgroundColor: "#ffe5e5",
                color: "#a33",
                borderRadius: "8px",
                fontSize: "0.9rem",
              }}
            >
              <strong>Error consulta:</strong> {resultError}
            </div>
          )}
        </section>
      )}
    </ClubLayout>
  );
}

export default App;
