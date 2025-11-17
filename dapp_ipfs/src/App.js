import React, { useCallback, useEffect, useState } from "react";
import './App.css';
import { create } from 'kubo-rpc-client'
import { ethers } from "ethers"
import { Buffer } from "buffer"
import logo from "./ethereumLogo.png"
import { addresses, abis } from "./contracts"
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000000000000000000000000000";
let client
const defaultProvider = new ethers.providers.Web3Provider(window.ethereum);
// version 6
//const defaultProvider = new ethers.BrowserProvider(window.ethereum);
const daoContract = new ethers.Contract(
	addresses.dao,
	abis.dao,
	defaultProvider
);
//contract = new ethers.Contract(address, abi, defaultProvider);
async function readCurrentUserFile() {
	const signer = defaultProvider.getSigner();
    const userAddress = await signer.getAddress();
    const result = await daoContract.userFiles(userAddress);
	console.log({ result });
	return result;
}
function App() {
	const [ipfsHash, setIpfsHash] = useState("");
	const [connectedAccount, setConnectedAccount] = useState(null);
	const [proposalId, setProposalId] = useState(0);
	const [file, setFile] = useState(null);
	//useEffect(() => {
	//	window.ethereum.enable();
	//}, []);
	/*
		*
		let abi = JSON.parse('[{"inputs": [{"internalType": "string","name": "file","type":
		"string"}],"name": "setFileIPFS","outputs": [],"stateMutability":
		"nonpayable","type": "function"},{"inputs": [{"internalType": "address","name":
		"","type": "address"}],"name": "userFiles","outputs": [{"internalType":
		"string","name": "","type": "string"}],"stateMutability": "view","type":
		"function"}]')
		let address = "0x7d2C909F0b4d2fb2993b92CC343A6834585831BF";
		*
	*/
	//let [connected, setConnected] = useState(false);
	
	
	// --- Conexión automática a Metamask ---
	
	useEffect(() => {
	async function init() {
		try {
			// Obliga a Metamask a usar Sepolia
			await window.ethereum.request({
				method: "wallet_switchEthereumChain",
				params: [{ chainId: "0xaa36a7" }],
			});
			// Solicita conexión a Metamask
			await window.ethereum.request({ method: "eth_requestAccounts" });
		
			// Obtiene la cuenta conectada
			const accounts = await defaultProvider.listAccounts();
			if (accounts.length > 0) setConnectedAccount(accounts[0]);
		
			// Solo intentar leer la propuesta si proposalId es válido
			if (proposalId && Number.isInteger(Number(proposalId)) && Number(proposalId) > 0) {
				const proposalIdNum = Number(proposalId);
				let cid;
				try {
				cid = await daoContract.proposalDocuments(proposalIdNum);
				} catch (error) {
				console.warn(`No se pudo leer proposalDocuments para ID ${proposalIdNum}:`, error);
				cid = null; // No existe o no es válido
				}
				if (cid && cid !== "") setIpfsHash(cid);
			}
		} catch (error) {
		console.error("Error inicializando la conexión con Metamask o el contrato:", error);
		}
	}
	init();
	}, [proposalId]);

	
	async function setFileIPFS(hash) {
		const ipfsWithSigner = daoContract.connect(defaultProvider.getSigner());
		console.log("TX contract");
		const tx = await ipfsWithSigner.setFileIPFS(hash);
		console.log({ tx });
		setIpfsHash(hash);
	}
	
	// ---- FUNCIONES CONTRATO ----

	// Cerrar una propuesta
	async function closeProposal(proposalId) {
		const signer = defaultProvider.getSigner();
		const daoWithSigner = daoContract.connect(signer);
		const tx = await daoWithSigner.closeProposal(proposalId);
		await tx.wait();
		console.log(`Propuesta ${proposalId} cerrada`);
	}

	// Guardar el documento (CID de IPFS) en el contrato
	async function saveProposalDocument(proposalId, cid) {
		const signer = defaultProvider.getSigner();
		const daoWithSigner = daoContract.connect(signer);
		const tx = await daoWithSigner.setProposalDocument(proposalId, cid);
		await tx.wait();
		console.log(`Documento IPFS guardado para la propuesta ${proposalId}`);
	}
	
	async function closeAndSaveToIPFS(proposalId) {
		try {
			const signer = defaultProvider.getSigner();
			const daoWithSigner = daoContract.connect(signer);
		
			// Cerrar la propuesta
			const txClose = await daoWithSigner.closeProposal(proposalId);
			await txClose.wait();
			console.log(`Propuesta ${proposalId} cerrada`);
		
			// Obtener los datos de la propuesta cerrada
			const proposal = await daoContract.proposals(proposalId);
			const proposalData = {
				id: proposal.id.toString(),
				description: proposal.description,
				positiveVotes: proposal.positiveVotes.toString(),
				negativeVotes: proposal.negativeVotes.toString(),
				positiveVotesWeight: proposal.positiveVotesWeight.toString(),
				negativeVotesWeight: proposal.negativeVotesWeight.toString(),
				isActive: proposal.isActive,
				deadline: proposal.deadline.toString()
			};
		
			// Convertir a buffer
			const buffer = Buffer.from(JSON.stringify(proposalData));
		
			// Subir a IPFS
			const client = create({ url: 'http://127.0.0.1:5001/api/v0' });
			const result = await client.add(buffer);
			console.log("CID en IPFS:", result.cid.toString());
		
			// Guardar el CID en el contrato
			const txSetCID = await daoWithSigner.setProposalDocument(proposalId, result.cid.toString());
			await txSetCID.wait();
			console.log(`Documento IPFS guardado para la propuesta ${proposalId}`);
		
			// Actualizar estado en el front-end
			setIpfsHash(result.cid.toString());
    
		} catch (error) {
			console.error("Error cerrando y guardando propuesta:", error);
		}
	}

	// ---- FUNCIONES IPFS ----
	
	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			console.log(file)
			// Validaciones
			if (!file) {
				alert("Selecciona un archivo primero.");
				return;
			}
			if (!proposalId) {
				alert("Introduce un ID de propuesta.");
				return;
			}
			// conectar a la instancia en local de ipfs
			const client = await create('/ip4/0.0.0.0/tcp/5001')
			//const client = create({ url: 'http://host.docker.internal:5001/api/v0' }); //Version para DockerDesktop

			
			// añadir le archivo a ipfs
			const result = await client.add(file)
			// añadir al fs del nodo ipfs en local para poder visualizarlo en el dashboard
			await client.files.cp(`/ipfs/${result.cid}`, `/${result.cid}`)
			console.log(result.cid)
			// añadir el CID de ipfs a ethereum a traves del smart contract
			//await setFileIPFS(result.cid.toString());
			setIpfsHash(result.cid.toString()); // pone el hash para el archivo
			
			// Cerrar propuesta y guardar el CID
			//await closeProposal(proposalId);
			//await saveProposalDocument(proposalId, result.cid.toString());
			await closeAndSaveToIPFS(proposalId);
			
			} catch (error) {
			console.log(error.message);
		}
	};

	const retrieveFile = (e) => {
		const data = e.target.files[0];
		const reader = new window.FileReader();
		reader.readAsArrayBuffer(data);
		console.log(data);
		reader.onloadend = () => {
			console.log("Buffer data: ", Buffer(reader.result));
			setFile(Buffer(reader.result));
		}
		e.preventDefault();
	}
	return (
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo" />
				<h2>DAO Document Uploader</h2>

				{connectedAccount ? (
				<p>Conectado como: {connectedAccount}</p>
				) : (
				<p>Conectando con Metamask...</p>
				)}

				<form className="form" onSubmit={async (e) => {
					e.preventDefault();
					if (!proposalId) {
						alert("Introduce un ID de propuesta");
						return;
					}
					await closeAndSaveToIPFS(proposalId);
					}}>
					<input
						type="number"
						placeholder="ID de la propuesta"
						value={proposalId}
						onChange={(e) => setProposalId(e.target.value)}
						style={{ marginBottom: "10px", padding: "5px" }}
					/>
					<button type="submit" className="btn">
						Cerrar propuesta y subir a IPFS
					</button>
				</form>

				{ipfsHash && (
					<p>
						Archivo IPFS:{" "}
						<a
							href={`https://ipfs.io/ipfs/${ipfsHash}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							{ipfsHash}
						</a>
					</p>
				)}
			</header>
		</div>
	);
}
export default App;