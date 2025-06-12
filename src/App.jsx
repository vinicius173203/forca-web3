import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import './App.css';
import { GlobalProvider, GlobalContext } from './Global.jsx';
import NormalHardcore from './NormalHardcore.jsx';
import PvP from './PvP.jsx';
import HowToPlay from './HowToPlay.jsx';
import { Route, Routes, Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent = () => {
  const {
    account,
    isConnected,
    language,
    setLanguage,
    showWalletModal,
    setShowWalletModal,
    showNetworkModal,
    setShowNetworkModal,
    connectWallet,
    renderLeaderboard,
    renderNetworkModal,
    translations,
    disconnectWallet,
    currentNetwork,
    switchNetwork,
    contractAddress
  } = useContext(GlobalContext);

  const [gameMode, setGameMode] = useState('easy');

    return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <div style={{
  position: 'absolute',
  top: '7px',
  right: '20px',
  padding: '15px',
  backgroundColor: '#1a1d3e',
  borderRadius: '12px',
  boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  width: '150px',
  gap: '10px',
}}>
  {!isConnected ? (
    <button
      className="action-button"
      onClick={() => setShowWalletModal(true)}
      style={{ width: '100%' }}
    >
      {translations[language].connect}
    </button>
  ) : (
    <>
      <div style={{ color: '#fff', fontSize: '14px' }}>
        👤 {account.slice(0, 6)}...{account.slice(-4)}
      </div>
      <span style={{ color: '#00f0ff', fontSize: '0.9rem', marginBottom: '5px' }}>
        {language === 'pt' ? 'Selecione sua rede' : 'Select Network'}
      </span>
      <button
        className="network-button"
        onClick={() => setShowNetworkModal(true)}
        style={{ width: '100%' }}
      >
        {currentNetwork === 'somnia' ? 'Somnia' : 'Monad'}
      </button>
      <button
        className="action-button"
        onClick={disconnectWallet}
        style={{ width: '100%' }}
      >
        {translations[language].pt ? 'Desconectar' : 'Disconnect'}
      </button>
    </>
  )}
</div>



              <div className="main-container">
                <div className="sidebar-section">
                  <Link to="/how-to-play" className="how-to-play-button">
                    {translations[language].pt ? 'Como Jogar' : 'How to Play'}
                  </Link>
                </div>

                <div className="game-and-leaderboard">
                  <div className="game-section">
                    <div style={{ position: 'relative', width: '100%', textAlign: 'center', marginBottom: '20px' }}>
                      <img
                        src="/forca.png"
                        alt="Forca Left"
                        style={{
                          position: 'absolute',
                          left: '10%',
                          top: '30px',
                          width: '130px',
                        }}
                      />
                      <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#00f0ff', textShadow: '0 0 10px #00f0ff' }}>
                        Forca Web3
                      </h1>
                      <img
                        src="/forca.png"
                        alt="Forca Right"
                        style={{
                          position: 'absolute',
                          right: '10%',
                          top: '30px',
                          width: '130px',
                        }}
                      />
                    </div>

                    <div>
                      <button className="action-button" onClick={() => setLanguage('pt')}>
                        Português
                      </button>
                      <button className="action-button" onClick={() => setLanguage('en')}>
                        English
                      </button>
                    </div>
                    <div style={{ marginTop: '20px' }}>
                      <h2>{translations[language].pt ? 'Selecionar Modo de Jogo' : 'Select Game Mode'}</h2>
                      <label style={{ marginRight: '15px' }}>
                        <input
                          type="radio"
                          name="gameMode"
                          value="easy"
                          checked={gameMode === 'easy'}
                          onChange={() => setGameMode('easy')}
                        />
                        {translations[language].pt ? ' Modo Fácil' : ' Easy Mode'}
                      </label>
                      <label style={{ marginRight: '15px' }}>
                        <input
                          type="radio"
                          name="gameMode"
                          value="normal"
                          checked={gameMode === 'normal'}
                          onChange={() => setGameMode('normal')}
                        />
                        {translations[language].pt ? ' Modo Normal' : ' Normal Mode'}
                      </label>
                      <label style={{ marginRight: '15px' }}>
                        <input
                          type="radio"
                          name="gameMode"
                          value="hardcore"
                          checked={gameMode === 'hardcore'}
                          onChange={() => setGameMode('hardcore')}
                        />
                        {translations[language].pt ? ' Modo Hardcore' : ' Hardcore Mode'}
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="gameMode"
                          value="pvp"
                          checked={gameMode === 'pvp'}
                          onChange={() => setGameMode('pvp')}
                        />
                        {translations[language].pt ? ' Modo PvP' : ' PvP Mode'}
                      </label>
                    </div>
                    {gameMode === 'pvp' ? (
                      <PvP gameMode={gameMode} setGameMode={setGameMode} />
                    ) : (
                      <NormalHardcore gameMode={gameMode} />
                    )}
                  </div>

                  <div className="leaderboard-section">{renderLeaderboard()}</div>
                </div>
              </div>
            
               {showWalletModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="modal-overlay"
                  onClick={() => setShowWalletModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h2>{translations[language].pt ? 'Escolha sua carteira' : 'Choose your wallet'}</h2>
                    <button onClick={() => connectWallet('metamask')}>
                      <img src="/metamask.png" alt="MetaMask" style={{ width: '24px', marginRight: '8px' }} />
                      MetaMask
                    </button>
                    <button onClick={() => connectWallet('okx')}>
                      <img src="/okx.png" alt="OKX Wallet" style={{ width: '24px', marginRight: '8px' }} />
                      OKX Wallet
                    </button>
                    <button onClick={() => connectWallet('backpack')}>
                      <img src="/backpack-icon.png" alt="Backpack" style={{ width: '24px', marginRight: '8px' }} />
                      Backpack
                    </button>
                    <button onClick={() => connectWallet('phantom')}>
                      <img src="/phantom-icon.png" alt="Phantom" style={{ width: '24px', marginRight: '8px' }} />
                      Phantom
                    </button>
                  </motion.div>
                </motion.div>
              )}

              {/* Adicione o modal de rede */}
              {renderNetworkModal()}

              <div className="contract-address">                
                  {translations[language].pt ? 'Endereço do contrato:' : 'Contract address:'} {contractAddress}
                
              </div>
            </>
          }
        />
        <Route path="/how-to-play" element={<HowToPlay />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <GlobalProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </GlobalProvider>
  );
};

export default App;