import React, { useEffect, useState, createContext } from 'react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import rawContract from './ForcaGame.json';

// Definir as variáveis de ambiente com fallback
const contractAddress = '0x88C6bF0246f2A48456F0f384BAe1cDF1C85834ef';
const BACKEND_URL = 'https://backend-leaderboard-production.up.railway.app';
const BACKEND_UR = 'https://palavras-production.up.railway.app';
const contractABI = rawContract.abi;

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
  const [currentChainId, setCurrentChainId] = useState(null);
  const [networkPromptRejected, setNetworkPromptRejected] = useState(false);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false); // Novo estado pra controle de carregamento

  // Definir translations dentro do GlobalProvider
  const translations = {
    pt: {
      start: 'Começar Jogo',
      restart: 'Recomeçar',
      chances: 'Tentativas restantes',
      connect: 'Conectar Carteira',
      disconnect: 'Desconectar Carteira',
      leaderboard: 'Tabela de Classificação',
      timeLeft: 'Tempo Restante',
      contractError: 'Erro ao conectar com o contrato!',
      walletRejected: 'Você rejeitou a conexão com a carteira.',
      walletNotDetected: 'Carteira não detectada. Verifique se ela está instalada e ativa.',
      storageError: 'Erro de armazenamento: acesso ao localStorage ou sessionStorage bloqueado. Tente desativar modo anônimo ou extensões de privacidade.',
      walletConnected: 'Carteira conectada com sucesso!',
      switchToMonad: 'Por favor, mude para a Monad Testnet para continuar.',
      wrongNetwork: 'Rede incorreta! Por favor, mude para a Monad Testnet.',
      leaderboardLoading: 'Carregando tabela de classificação...',
      leaderboardError: 'Erro ao carregar a tabela de classificação.',
    },
    en: {
      start: 'Start Game',
      restart: 'Restart',
      chances: 'Chances left',
      connect: 'Connect Wallet',
      disconnect: 'Disconnect Wallet',
      leaderboard: 'Leaderboard',
      timeLeft: 'Time Left',
      contractError: 'Error connecting to contract!',
      walletRejected: 'You rejected the wallet connection.',
      walletNotDetected: 'Wallet not detected. Please ensure it is installed and active.',
      storageError: 'Storage error: access to localStorage or sessionStorage is blocked. Try disabling private mode or privacy extensions.',
      walletConnected: 'Wallet connected successfully!',
      switchToMonad: 'Please switch to Monad Testnet to continue.',
      wrongNetwork: 'Wrong network! Please switch to Monad Testnet.',
      leaderboardLoading: 'Loading leaderboard...',
      leaderboardError: 'Error loading leaderboard.',
    },
  };

  // Inicializa o contrato apenas quando a carteira for conectada e a rede for a correta
  const initializeContract = async (ethProvider) => {
    try {
      const chainId = await ethProvider.request({ method: 'eth_chainId' });
      setCurrentChainId(chainId);
      const monadTestnetChainId = '0x27cf'; // Chain ID 10143 em hexadecimal

      if (chainId !== monadTestnetChainId) {
        alert(translations[language].switchToMonad);
        return false;
      }

      const provider = new ethers.BrowserProvider(ethProvider);
      setProvider(provider);
      const signer = await provider.getSigner();
      setSigner(signer);
      const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
      setContract(contractInstance);
      const address = await signer.getAddress();
      setAccount(address);
      setIsConnected(true);
      return true;
    } catch (err) {
      console.error('Erro ao inicializar contrato:', err);
      alert(translations[language].contractError);
      return false;
    }
  };

  // Função para conectar a carteira
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

      // Conecta a carteira sem mudar a rede
      await ethProvider.request({ method: 'eth_requestAccounts' });
      alert(translations[language].walletConnected);

      // Após conectar, inicializa o contrato e verifica a rede
      const initialized = await initializeContract(ethProvider);
      if (initialized) {
        setShowWalletModal(false);
      }
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

  // Função para desconectar a carteira
  async function disconnectWallet() {
    try {
      if (window.ethereum && window.ethereum.isMetaMask) {
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        });
      }

      setAccount('');
      setIsConnected(false);
      setContract(null);
      setSigner(null);
      setProvider(null);
      setShowWalletModal(false);
      setCurrentChainId(null);
      setNetworkPromptRejected(false);
      setLeaderboard([]); // Limpa o leaderboard ao desconectar
      setIsLeaderboardLoading(false);
    } catch (err) {
      console.error('Erro ao desconectar carteira:', err);
    }
  }

  // Listener para mudanças de rede e contas
  useEffect(() => {
    if (window.ethereum) {
      // Verifica contas conectadas ao carregar a página
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          initializeContract(window.ethereum);
        }
      });

      // Listener para mudanças de conta
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
          setCurrentChainId(null);
          setNetworkPromptRejected(false);
          setLeaderboard([]);
          setIsLeaderboardLoading(false);
        }
      });

      // Listener para mudanças de rede
      window.ethereum.on('chainChanged', (chainId) => {
        setCurrentChainId(chainId);
        const monadTestnetChainId = '0x27cf';
        if (chainId === monadTestnetChainId) {
          if (account) {
            initializeContract(window.ethereum);
          }
        } else {
          setContract(null);
          setSigner(null);
          setProvider(null);
          setIsConnected(false);
          setLeaderboard([]);
          setIsLeaderboardLoading(false);
          alert(translations[language].wrongNetwork);
        }
      });

      return () => {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      };
    }
  }, [account]);

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
    if (isLeaderboardLoading) return; // Evita chamadas simultâneas
    setIsLeaderboardLoading(true);
    try {
      console.log('Iniciando busca do leaderboard...');
      const data = await fetchWithBackoff(`${BACKEND_URL}/leaderboard`);
      const leaderboardData = data.map((item) => ({
        address: item.address,
        points: item.points.toString(),
      }));
      setLeaderboard(leaderboardData);
      console.log('Leaderboard carregado com sucesso:', leaderboardData);
    } catch (err) {
      console.error('Erro ao buscar leaderboard do backend:', err);
      alert(translations[language].leaderboardError);
    } finally {
      setIsLeaderboardLoading(false);
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

  // Carrega o leaderboard e verifica o owner apenas uma vez quando o contract é inicializado
  useEffect(() => {
    if (contract && !isLeaderboardLoading) {
      fetchLeaderboard();
      checkOwner();
    }
  }, [contract]); // Removido 'account' das dependências pra evitar loops

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
    if (isLeaderboardLoading) {
      return <p>{translations[language].leaderboardLoading}</p>;
    }

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
        disconnectWallet,
        fetchLeaderboard,
        ProgressBar,
        renderMessage,
        renderLeaderboard,
        translations,
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