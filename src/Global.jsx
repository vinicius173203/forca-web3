import React, { useEffect, useState, createContext } from 'react';
   import { ethers } from 'ethers';
   import { motion } from 'framer-motion';
   import rawContract from './ForcaGame.json';

   // Definir as variáveis de ambiente com fallback
   const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0x88C6bF0246f2A48456F0f384BAe1cDF1C85834ef';
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://backend-leaderboard-production.up.railway.app';
    const BACKEND_UR = import.meta.env.VITE_BACKEND_UR || 'https://palavras-production.up.railway.app';
    const contractABI = rawContract.abi;

   // Debug das variáveis
   console.log({ contractAddress, BACKEND_URL, BACKEND_UR });

   export const GlobalContext = createContext();

   export const GlobalProvider = ({ children }) => {
     const [provider, setProvider] = useState(null);
     const [signer, setSigner] = useState(null);
     const [contract, setContract] = useState(null);
     const [account, setAccount] = useState('');
     const [isConnected, setIsConnected] = useState(false);
     const [language, setLanguage] = useState('pt');
     const [leaderboard, setLeaderboard] = useState([]);
     const [isOwner, setIsOwner] = useState(false);
     const [showWalletModal, setShowWalletModal] = useState(false);

     // Definir translations dentro do GlobalProvider
     const translations = {
       pt: {
         start: 'Começar Jogo',
         restart: 'Recomeçar',
         chances: 'Tentativas restantes',
         connect: 'Conectar Carteira',
         leaderboard: 'Tabela de Classificação',
         timeLeft: 'Tempo Restante',
         contractError: 'Erro ao conectar com o contrato!',
         walletRejected: 'Você rejeitou a conexão com a carteira.',
         walletNotDetected: 'Carteira não detectada. Verifique se ela está instalada e ativa.',
         storageError: 'Erro de armazenamento: acesso ao localStorage ou sessionStorage bloqueado. Tente desativar modo anônimo ou extensões de privacidade.',
       },
       en: {
         start: 'Start Game',
         restart: 'Restart',
         chances: 'Chances left',
         connect: 'Connect Wallet',
         leaderboard: 'Leaderboard',
         timeLeft: 'Time Left',
         contractError: 'Error connecting to contract!',
         walletRejected: 'You rejected the wallet connection.',
         walletNotDetected: 'Wallet not detected. Please ensure it is installed and active.',
         storageError: 'Storage error: access to localStorage or sessionStorage is blocked. Try disabling private mode or privacy extensions.',
       },
     };

     // Inicializa o contrato apenas quando a carteira for conectada
     const initializeContract = async (ethProvider) => {
       try {
         const provider = new ethers.BrowserProvider(ethProvider);
         setProvider(provider);
         const signer = await provider.getSigner();
         setSigner(signer);
         const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
         setContract(contractInstance);
         const address = await signer.getAddress();
         setAccount(address);
         setIsConnected(true);
       } catch (err) {
         console.error('Erro ao inicializar contrato:', err);
         alert(translations[language].contractError);
       }
     };

     useEffect(() => {
       // Verifica contas conectadas apenas para atualizar o estado, sem tentar conectar
       if (window.ethereum) {
         window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
           if (accounts.length > 0) {
             setAccount(accounts[0]);
             setIsConnected(true);
             initializeContract(window.ethereum);
           }
         });

         window.ethereum.on('accountsChanged', accounts => {
           if (accounts.length > 0) {
             setAccount(accounts[0]);
             setIsConnected(true);
             initializeContract(window.ethereum);
           } else {
             setAccount('');
             setIsConnected(false);
             setContract(null);
             setSigner(null);
             setProvider(null);
           }
         });

         return () => {
           window.ethereum.removeListener('accountsChanged', () => {});
         };
       }
     }, []);

     async function connectWallet(walletType) {
       try {
         let ethProvider;

         if (walletType === 'metamask' && window.ethereum?.isMetaMask) {
           ethProvider = window.ethereum;
         } else if (walletType === 'okx' && window.okxwallet?.ethereum) {
           ethProvider = window.okxwallet.ethereum;
         } else if (walletType === 'phantom' && window.phantom?.ethereum) {
           ethProvider = window.phantom.ethereum;
         } else if (walletType === 'backpack' && window.backpack?.ethereum) {
           ethProvider = window.backpack.ethereum;
         } else {
           alert(translations[language].walletNotDetected);
           return;
         }

         await ethProvider.request({ method: 'eth_requestAccounts' });
         await initializeContract(ethProvider);
         setShowWalletModal(false);
       } catch (err) {
         console.error('Erro ao conectar carteira:', err);
         if (err.message.includes('storage')) {
           alert(translations[language].storageError);
         } else if (err.code === 4001) {
           alert(translations[language].walletRejected);
         } else {
           alert('Erro ao conectar: ' + err.message);
         }
       }
     }

     async function fetchWithBackoff(url, retries = 3, delay = 1000) {
       for (let i = 0; i < retries; i++) {
         try {
           const response = await fetch(url);
           if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
           return await response.json();
         } catch (err) {
           if (i === retries - 1) throw err;
           console.warn(`Tentativa ${i + 1} falhou. Tentando novamente em ${delay * Math.pow(2, i)}ms...`);
           await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
         }
       }
     }

     async function fetchLeaderboard() {
       try {
         const data = await fetchWithBackoff(`${BACKEND_URL}/leaderboard`);
         const leaderboardData = data.map((item) => ({
           address: item.address,
           points: item.points.toString(),
         }));
         setLeaderboard(leaderboardData);
         console.log('Leaderboard carregado com sucesso:', leaderboardData);
       } catch (err) {
         console.error('Erro ao buscar leaderboard do backend:', err);
       }
     }

     async function checkOwner() {
       if (!contract) return;
       try {
         const owner = await contract.owner();
         setIsOwner(owner.toLowerCase() === account.toLowerCase());
       } catch (err) {
         console.error('Erro ao verificar proprietário:', err);
       }
     }

     useEffect(() => {
       if (contract) {
         fetchLeaderboard();
         checkOwner();
       }
     }, [contract, account]);

     const ProgressBar = ({ timeLeft, maxTime }) => {
       const percentage = (timeLeft / maxTime) * 100;
       return (
         <div style={{ width: '100%', backgroundColor: '#eee', borderRadius: '10px', height: '10px', marginTop: '10px' }}>
           <div
             style={{
               width: `${percentage}%`,
               height: '100%',
               backgroundColor: percentage <= 10 ? 'red' : '#4caf50',
               borderRadius: '10px',
               transition: 'width 1s linear',
             }}
           />
         </div>
       );
     };

     const renderMessage = (message) => {
       if (!message) return null;
       return (
         <motion.div
           initial={{ scale: 0.5, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ type: 'spring', stiffness: 300, damping: 20 }}
           className="message"
           style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '10px' }}
         >
           {message}
         </motion.div>
       );
     };

     const renderLeaderboard = () => {
       if (leaderboard.length === 0) {
         return <p>{translations[language].pt ? 'Nenhum jogador no leaderboard ainda.' : 'No players in the leaderboard yet.'}</p>;
       }
       return (
         <div style={{ marginTop: '20px' }}>
           <h2>{translations[language].leaderboard}</h2>
           <table style={{ margin: '0 auto', borderCollapse: 'collapse' }}>
             <thead>
               <tr>
                 <th style={{ border: '1px solid black', padding: '5px' }}>{translations[language].pt ? 'Posição' : 'Rank'}</th>
                 <th style={{ border: '1px solid black', padding: '5px' }}>{translations[language].pt ? 'Endereço' : 'Address'}</th>
                 <th style={{ border: '1px solid black', padding: '5px' }}>{translations[language].pt ? 'Pontos' : 'Points'}</th>
               </tr>
             </thead>
             <tbody>
               {leaderboard.map((player, index) => (
                 <tr key={player.address}>
                   <td style={{ border: '1px solid black', padding: '5px' }}>{index + 1}</td>
                   <td style={{ border: '1px solid black', padding: '5px' }}>
                     {player.address.slice(0, 6)}...{player.address.slice(-4)}
                   </td>
                   <td style={{ border: '1px solid black', padding: '5px' }}>{player.points}</td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       );
     };

     return (
       <GlobalContext.Provider
         value={{
           provider,
           signer,
           contract,
           account,
           isConnected,
           language,
           setLanguage,
           leaderboard,
           isOwner,
           showWalletModal,
           setShowWalletModal,
           connectWallet,
           fetchLeaderboard,
           ProgressBar,
           renderMessage,
           renderLeaderboard,
           translations, // Incluído no contexto
           BACKEND_URL,
           BACKEND_UR,
           contractAddress,
           contractABI,
         }}
       >
         {children}
       </GlobalContext.Provider>
     );
   };