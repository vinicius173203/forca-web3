import React, { useEffect, useState, createContext } from 'react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import rawContract from './ForcaGame.json';

// Configuração de redes suportadas
const SUPPORTED_NETWORKS = {
  somnia: {
    chainId: '0xc488', // 50312 em hexadecimal
    chainName: 'Somnia Testnet',
    nativeCurrency: {
      name: 'STT',
      symbol: 'STT',
      decimals: 18
    },
    rpcUrls: ['https://dream-rpc.somnia.network'],
    blockExplorerUrls: ['https://somnia.console.so/']
  },
  monad: {
    chainId: '0x279f', // Monad em hexadecimal (não oficial, verifique o chainId correto)
    chainName: 'Monad Testnet',
    nativeCurrency: {
      name: 'MON',
      symbol: 'MON',
      decimals: 18
    },
    rpcUrls: ['https://testnet-rpc.monad.xyz'], // Verifique o RPC correto
    blockExplorerUrls: ['https://monad-testnet.socialscan.io/'] // Verifique o explorer correto
  }
};

// Contratos por rede
const CONTRACT_ADDRESSES = {
  somnia: '0x6Bf69Ce556233E3c1A3B94e3F0c95C1479e1c22a',
  monad: '0xBEa6E7c7c4375111C512d9966D2D75F0873d16Ab'
};

//'http://localhost:3003';
//'http://localhost:3002';
const contractABI = rawContract.abi;
const BACKEND_UR = import.meta.env.VITE_APP_BACKEND_UR; //palavras
const LEADBOARD = import.meta.env.VITE_APP_LEADBOARD; //leadboard

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
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState('somnia');
  const [contractAddress, setContractAddress] = useState(CONTRACT_ADDRESSES.somnia);

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
      leaderboardLoading: 'Loading leaderboard...',
      leaderboardError: 'Error loading leaderboard.',
    },
  };

  // Inicializa o contrato com base na rede atual
  const initializeContract = async (ethProvider) => {
    try {
      const provider = new ethers.BrowserProvider(ethProvider);
      setProvider(provider);
      const signer = await provider.getSigner();
      setSigner(signer);
      
      // Usa o endereço do contrato baseado na rede atual
      const currentContractAddress = CONTRACT_ADDRESSES[currentNetwork];
      const contractInstance = new ethers.Contract(currentContractAddress, contractABI, signer);
      setContract(contractInstance);
      setContractAddress(currentContractAddress);
      
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

  // Função para mudar de rede
  const switchNetwork = async (networkName) => {
    try {
      if (!window.ethereum) {
        alert(translations[language].walletNotDetected);
        return;
      }

      const networkConfig = SUPPORTED_NETWORKS[networkName];
      if (!networkConfig) {
        alert('Rede não suportada');
        return;
      }

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: networkConfig.chainId }],
        });
      } catch (switchError) {
        // Se a rede não estiver adicionada, tente adicioná-la
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [networkConfig],
            });
          } catch (addError) {
            console.error('Erro ao adicionar rede:', addError);
            alert('Erro ao adicionar rede');
            return;
          }
        } else {
          console.error('Erro ao mudar de rede:', switchError);
          alert('Erro ao mudar de rede');
          return;
        }
      }

      // Atualiza o estado da rede e reconecta
      setCurrentNetwork(networkName);
      setContractAddress(CONTRACT_ADDRESSES[networkName]);
      setShowNetworkModal(false);
      
      // Reinicializa o contrato com a nova rede
      if (isConnected) {
        await initializeContract(window.ethereum);
      }
    } catch (err) {
      console.error('Erro ao mudar de rede:', err);
      alert('Erro ao mudar de rede');
    }
  };

  // Função para conectar a carteira
  async function connectWallet(walletType) {
    try {
      let ethProvider;

      if (walletType === 'metamask') {
        if (!window.ethereum || !window.ethereum.isMetaMask) {
          alert(translations[language].walletNotDetected);
          console.error('MetaMask not detected.');
          return;
        }
        ethProvider = window.ethereum;
      } else if (walletType === 'okx' && window.okxwallet?.ethereum) {
        ethProvider = window.okxwallet.ethereum;
      } else if (walletType === 'phantom' && window.phantom?.ethereum) {
        ethProvider = window.phantom.ethereum;
      } else if (walletType === 'backpack' && window.backpack?.ethereum) {
        ethProvider = window.backpack.ethereum;
      } else {
        alert(translations[language].walletNotDetected);
        console.error(`Wallet ${walletType} not detected.`);
        return;
      }

      // Conecta a carteira
      try {
        await ethProvider.request({ method: 'eth_requestAccounts' });
        console.log(`${walletType} wallet connected successfully.`);
        alert(translations[language].walletConnected);
      } catch (err) {
        if (err.code === 4001) {
          alert(translations[language].walletRejected);
          console.error('User rejected wallet connection:', err);
        } else {
          alert('Error connecting wallet: ' + err.message);
          console.error('Error connecting wallet:', err);
        }
        return;
      }

      // Inicializa o contrato após conexão
      const initialized = await initializeContract(ethProvider);
      if (initialized) {
        setShowWalletModal(false);
      }
    } catch (err) {
      console.error('Unexpected error in connectWallet:', err);
      if (err.message.includes('storage')) {
        alert(translations[language].storageError);
      } else {
        alert('Unexpected error: ' + err.message);
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
      setLeaderboard([]);
      setIsLeaderboardLoading(false);
    } catch (err) {
      console.error('Erro ao desconectar carteira:', err);
    }
  }

  // Listener para mudanças de contas e rede
  useEffect(() => {
    if (window.ethereum) {
      // Verifica contas conectadas ao carregar a página
      const checkAccounts = async () => {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            await initializeContract(window.ethereum);
          }
        } catch (err) {
          console.error('Error checking accounts:', err);
        }
      };
      checkAccounts();

      // Listener para mudanças de conta
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          await initializeContract(window.ethereum);
        } else {
          setAccount('');
          setIsConnected(false);
          setContract(null);
          setSigner(null);
          setProvider(null);
          setLeaderboard([]);
          setIsLeaderboardLoading(false);
        }
      };

      // Listener para mudanças de rede
      const handleChainChanged = async () => {
        if (isConnected) {
          await initializeContract(window.ethereum);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [currentNetwork, isConnected]);

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

  async function checkOwner() {
    if (!contract) return;
    try {
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
    } catch (err) {
      console.error('Erro ao verificar proprietário:', err);
    }
  }

  // Carrega o leaderboard e verifica o owner quando o contrato é inicializado
 useEffect(() => {
  if (contract && !isLeaderboardLoading) {
    fetchLeaderboardPaginated(currentNetwork, 1).then((data) => {
      setLeaderboard(data.data);
    });
    checkOwner();
  }
}, [contract]);


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
const fetchLeaderboardPaginated = async (network, page = 1) => {
  try {
    const response = await fetch(`${LEADBOARD}/leaderboard?network=${network}&page=${page}`);
    if (!response.ok) throw new Error('Erro ao buscar leaderboard');
    return await response.json();
  } catch (err) {
    console.error(err);
    return { total: 0, data: [] };
  }
};

  const renderNetworkModal = () => {
    if (!showNetworkModal) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
        onClick={() => setShowNetworkModal(false)}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <h2>{translations[language].pt ? 'Selecione a Rede' : 'Select Network'}</h2>
          <button onClick={() => switchNetwork('somnia')}>
            <img src="/sommia.ico" alt="Somnia" style={{ width: '24px', marginRight: '8px' }} />
            Somnia Testnet
          </button>
          <button onClick={() => switchNetwork('monad')}>
            <img src="/monad.png" alt="Monad" style={{ width: '24px', marginRight: '8px' }} />
            Monad Testnet
          </button>
        </motion.div>
      </motion.div>
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
        showNetworkModal,
        setShowNetworkModal,
        currentNetwork,
        switchNetwork,
        connectWallet,
        disconnectWallet,
        ProgressBar,
        renderMessage,
        renderLeaderboard,
        renderNetworkModal,
        translations,
        BACKEND_UR,
        LEADBOARD,
        contractAddress,
        contractABI,
        fetchLeaderboardPaginated,

      }}
    >
      {children}
      {renderNetworkModal()}
    </GlobalContext.Provider>
  );
};