import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import './App.css';
import { GlobalProvider, GlobalContext } from './Global.jsx';
import NormalHardcore from './NormalHardcore.jsx';
import PvP from './PvP.jsx';
import HowToPlay from './HowToPlay.jsx';
import { Route, Routes, Link } from 'react-router-dom';

const AppContent = () => {
  const {
    account,
    isConnected,
    language,
    setLanguage,
    showWalletModal,
    setShowWalletModal,
    connectWallet,
    renderLeaderboard,
    translations,
    disconnectWallet,
  } = useContext(GlobalContext);

  const [gameMode, setGameMode] = useState('normal');

  return (
    <>
      <Routes>
        {/* Rota pra página inicial */}
        <Route
          path="/"
          element={
            <>
              <div style={{ position: 'absolute', top: '10px', right: '20px', textAlign: 'right' }}>
                {!isConnected ? (
                  <div>
                    <p>{translations[language].connect}</p>
                    <button className="action-button" onClick={() => setShowWalletModal(true)}>
                      {translations[language].connect}
                    </button>
                  </div>
                ) : (
                  <>
                    <p>👤 {account.slice(0, 6)}...{account.slice(-4)}</p>
                    <button
                      className="action-button" 
                      onClick={disconnectWallet}
                    >
                      {translations[language].pt ? 'Desconectar' : 'Disconnect'}
                    </button>
                  </>
                )}
              </div>

              <div className="main-container">
                {/* Nova seção à esquerda pra o botão "Como Jogar" */}
                <div className="sidebar-section">
                  <Link to="/how-to-play" className="how-to-play-button">
                    {translations[language].pt ? 'Como Jogar' : 'How to Play'}
                  </Link>
                </div>

                {/* Seção de jogo e leaderboard */}
                <div className="game-and-leaderboard">
                  <div className="game-section">
                    <h1>Forca Web3</h1>
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
                      <NormalHardcore gameMode={gameMode} setGameMode={setGameMode} />
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
            </>
          }
        />

        {/* Rota pra página Como Jogar */}
        <Route path="/how-to-play" element={<HowToPlay />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <GlobalProvider>
      <AppContent />
    </GlobalProvider>
  );
};

export default App;