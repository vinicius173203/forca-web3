import React, { useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import { GlobalContext } from './Global.jsx';

const modeEnum = {
  facil: 0,
  normal: 1,
  hardcore: 2,
  pvp: 3,
};

const NormalHardcore = ({ gameMode }) => {
  const {
    contract,
    account,
    language,
    translations,
    BACKEND_UR,
    renderMessage,
    ProgressBar,
    fetchLeaderboard,
  } = useContext(GlobalContext);

  const [currentWord, setCurrentWord] = useState('');
  const [maskedWord, setMaskedWord] = useState('');
  const [chances, setChances] = useState(0);
  const [message, setMessage] = useState('');
  const [usedLetters, setUsedLetters] = useState([]);
  const [entryFee, setEntryFee] = useState('0');
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentHint, setCurrentHint] = useState('');
  const [useHint, setUseHint] = useState(true);
  const [secondHint, setSecondHint] = useState('');
  const [pendingEnd, setPendingEnd] = useState(null);
  const [hintLocked, setHintLocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    async function fetchEntryFee() {
      if (!contract) return;
      const modeIndex = modeEnum[gameMode];
      const config = await contract.modeConfigs(modeIndex);
      const fee = ethers.formatEther(config.entryFee);
      setEntryFee(fee);
    }
    fetchEntryFee();
  }, [gameMode, contract]);

  useEffect(() => {
    let timer;
    const tickSound = new Audio('/sounds/tick.wav');
    const warningSound = new Audio('/sounds/warning.wav');

    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          if (newTime <= 10) {
            warningSound.play();
          } else {
            tickSound.play();
          }
          return newTime;
        });
      }, 1000);
    } else if (gameActive && timeLeft <= 0 && currentWord && !pendingEnd) {
      setMessage(translations[language].pt ? '⏰ Tempo esgotado! Você perdeu!' : '⏰ Time’s up! You lost!');
      setGameActive(false);
      setPendingEnd({ won: false });
    }

    return () => clearInterval(timer);
  }, [gameActive, timeLeft, currentWord, pendingEnd, language]);

  useEffect(() => {
    if (pendingEnd) {
      forceEndGame(pendingEnd.won);
      setPendingEnd(null);
    }
  }, [pendingEnd]);

  useEffect(() => {
    function handleKeyPress(event) {
      const key = event.key.toLowerCase();
      if (/^[a-z]$/.test(key) && gameActive && !usedLetters.includes(key)) {
        handleGuess(key);
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameActive, usedLetters]);

  async function checkIfPlaying() {
    if (!contract || !account) return false;
    try {
      const isPlaying = await contract.players(account);
      setIsPlaying(isPlaying);
      return isPlaying;
    } catch (err) {
      console.error('Erro ao verificar estado do jogador:', err);
      return false;
    }
  }

  useEffect(() => {
    if (contract && account) {
      checkIfPlaying();
    }
  }, [contract, account]);

  async function startGame() {
    if (!contract) return;
    try {
      const isPlaying = await checkIfPlaying();
      if (isPlaying) {
        alert(
          translations[language].pt
            ? 'Você já está em um jogo ativo. Finalize o jogo atual antes de iniciar outro.'
            : 'You are already in an active game. Finish the current game before starting another.'
        );
        return;
      }
      const feeInWei = ethers.parseEther(entryFee);
      const modeIndex = modeEnum[gameMode];
      const tx = await contract.startGame(modeIndex, { value: feeInWei });
      await tx.wait();
      await loadWord();
      if (gameMode === 'hardcore') {
        setTimeLeft(60);
      } else {
        setTimeLeft(useHint ? 30 : 45);
      }
      setHintLocked(useHint);
      setGameActive(true);
      fetchLeaderboard();
    } catch (err) {
      console.error('Erro ao iniciar o jogo:', err);
      alert('Erro ao iniciar o jogo: ' + err.message);
    }
  }

  async function forceEndGame(won) {
    if (!contract) return;
    try {
      const wordLength = currentWord.length || 0;
      const basePoints = wordLength <= 6 ? 3 : wordLength <= 9 ? 4 : 5;
      const tokenId = 0;
      const hasHint = useHint && currentHint !== '';
      const maxTime = gameMode === 'hardcore' ? 60 : useHint ? 30 : 45;
      const completedInSeconds = maxTime - timeLeft;

      const response = await fetch('https://backend-assinatura-production.up.railway.app/sign-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: account,
          won,
          wordLength,
          tokenId,
          basePoints,
          hasHint,
          completedInSeconds,
          initialTime: gameMode === 'hardcore' ? 60 : useHint ? 30 : 45,
          mode: gameMode,
        }),
      });

      const { finalPoints, signature } = await response.json();
      const tx = await contract.endGame(won, wordLength, tokenId, finalPoints, signature);
      await tx.wait();
      setCurrentWord('');
      setMaskedWord('');
      setUsedLetters([]);
      setCurrentHint('');
      setSecondHint('');
      setGameActive(false);
      setTimeLeft(0);
      setIsPlaying(false);
      fetchLeaderboard();

      if (won) {
        alert('✅ Você ganhou! Recompensa entregue!');
      } else {
        alert('❌ Você perdeu! Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao finalizar jogo:', err);
      alert('Erro ao finalizar jogo: ' + err.message);
    }
  }

  async function loadWord() {
    try {
      const modeQuery = gameMode === 'hardcore' ? '&mode=hardcore' : '';
      const response = await fetch(`${BACKEND_UR}/get-word?lang=${language}&wallet=${account}${modeQuery}`);
      const data = await response.json();
      if (!data || !data.palavra) {
        throw new Error('Palavra não encontrada no backend');
      }
      setCurrentWord(data.palavra);
      setCurrentHint(data.dica || data.dica1 || '');
      setSecondHint(data.dica2 || '');
      setMaskedWord('_ '.repeat(data.palavra.length));
      setUsedLetters([]);
      setMessage('');

      if (gameMode === 'hardcore') {
        setChances(7);
      } else {
        const baseChances = data.palavra.length <= 6 ? 3 : data.palavra.length <= 9 ? 4 : 5;
        setChances(baseChances);
      }
    } catch (err) {
      console.error('Erro ao carregar palavra:', err);
      alert(translations[language].pt ? 'Erro ao carregar palavra.' : 'Error loading word.');
    }
  }

  async function handleGuess(letter) {
    if (!gameActive || usedLetters.includes(letter) || message) return;
    setUsedLetters((prev) => [...prev, letter]);
    if (!currentWord.includes(letter)) {
      setChances((prev) => {
        const newChances = prev - 1;
        if (newChances <= 0) {
          setMessage('❌ ' + (translations[language].pt ? 'Você perdeu!' : 'You lost!'));
          setGameActive(false);
          setPendingEnd({ won: false });
        }
        return newChances;
      });
      return;
    }

    const updated = maskedWord.split(' ').map((char, i) => (currentWord[i] === letter ? letter : char));
    setMaskedWord(updated.join(' '));
    if (!updated.includes('_')) {
      setMessage('✅ ' + (translations[language].pt ? 'Você venceu!' : 'You won!'));
      setGameActive(false);
      setPendingEnd({ won: true });
    }
  }

  const renderLetters = () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    return alphabet.map((letter) => (
      <button
        key={letter}
        className="letter-button"
        onClick={() => handleGuess(letter)}
        disabled={usedLetters.includes(letter) || message || !gameActive}
      >
        {letter.toUpperCase()}
      </button>
    ));
  };

  const renderChances = () => {
    if (!currentWord) return null;
    const total = gameMode === 'hardcore' ? 7 : currentWord.length <= 6 ? 3 : currentWord.length <= 9 ? 4 : 5;
    const safeChances = Math.max(0, chances);
    const safeMisses = Math.max(0, total - safeChances);
    return (
      <p>
        {translations[language].chances}: {'🔴'.repeat(safeChances)}
        {'⚪'.repeat(safeMisses)}
      </p>
    );
  };

  const renderTimer = () => {
    if (!gameActive) return null;
    return (
      <div>
        {translations[language].timeLeft}: {timeLeft} {translations[language].pt ? 'segundos' : 'seconds'}
        <ProgressBar timeLeft={timeLeft} maxTime={gameMode === 'hardcore' ? 60 : hintLocked ? 30 : 45} />
      </div>
    );
  };

  return (
    <div className="game-section">
      {account && (
        <>
          <div style={{ marginTop: '10px' }}>
            <label>
              <input
                type="checkbox"
                checked={useHint}
                onChange={() => setUseHint(!useHint)}
                disabled={gameActive}
              />
              {translations[language].pt ? ' Jogar com dica' : ' Play with hint'}
            </label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '10px' }}>
            <img src="/forca.png" alt="Forca" style={{ width: '130px', marginRight: '20px' }} />
            <img src="/forca.png" alt="Forca" style={{ width: '130px', marginLeft: '20px' }} />
          </div>
          <button className="action-button" onClick={startGame} disabled={isPlaying}>
            {translations[language].start}
          </button>
          {isPlaying && (
            <button
              className="action-button"
              onClick={() => forceEndGame(false)}
              style={{ marginLeft: '10px' }}
            >
              {translations[language].pt ? 'Finalizar Partida' : 'End Game'}
            </button>
          )}
          {gameActive && useHint && (
            <div className="hint">
              {gameMode === 'hardcore' ? (
                <>
                  <p>
                    <strong>{translations[language].pt ? 'Dica 1:' : 'Hint 1:'}</strong> {currentHint}
                  </p>
                  {timeLeft <= 30 && secondHint && (
                    <p>
                      <strong>{translations[language].pt ? 'Dica 2:' : 'Hint 2:'}</strong> {secondHint}
                    </p>
                  )}
                </>
              ) : (
                <p>
                  <strong>{translations[language].pt ? 'Dica:' : 'Hint:'}</strong> {currentHint}
                </p>
              )}
            </div>
          )}
          {gameActive && !useHint && (
            <p>{translations[language].pt ? 'Sem dica selecionada' : 'No hint selected'}</p>
          )}
          {gameActive && (
            <div style={{ marginTop: '10px' }}>
              <button className="action-button" onClick={() => forceEndGame(false)}>
                {translations[language].pt ? 'Forçar Derrota' : 'Force Loss'}
              </button>
            </div>
          )}
          <p className="masked-word">{maskedWord}</p>
          {renderChances()}
          {renderTimer()}
          <div style={{ margin: '10px' }}>{renderLetters()}</div>
          <p className="message">{renderMessage(message)}</p>
        </>
      )}
    </div>
  );
};

export default NormalHardcore;