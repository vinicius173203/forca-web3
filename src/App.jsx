import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import rawContract from './ForcaGame.json';
const contractABI = rawContract.abi;
import './App.css';

const contractAddress = '0xe5C8C755E5A2415305998d5FfDecA5009a590350'; // Atualize com o novo endereço após reimplantar

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [currentWord, setCurrentWord] = useState('');
  const [maskedWord, setMaskedWord] = useState('');
  const [chances, setChances] = useState(0);
  const [message, setMessage] = useState('');
  const [usedLetters, setUsedLetters] = useState([]);
  const [words, setWords] = useState([]);
  const [language, setLanguage] = useState('pt');
  const [entryFee, setEntryFee] = useState('0');
  const [gameActive, setGameActive] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentHint, setCurrentHint] = useState('');


  const translations = {
    pt: { start: 'Começar Jogo', restart: 'Recomeçar', chances: 'Tentativas restantes', connect: 'Conectar Carteira', leaderboard: 'Tabela de Classificação', timeLeft: 'Tempo Restante' },
    en: { start: 'Start Game', restart: 'Restart', chances: 'Chances left', connect: 'Connect Wallet', leaderboard: 'Leaderboard', timeLeft: 'Time Left' }
  };

  useEffect(() => {
    loadWords(language);
  }, [language]);

  useEffect(() => {
    let timer;
    const tickSound = new Audio('/sounds/tick.wav');
    const warningSound = new Audio('/sounds/warning.wav');
  
    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          if (newTime <= 10) {
            warningSound.play();
          } else {
            tickSound.play();
          }
          return newTime;
        });
      }, 1000);
    } else if (gameActive && timeLeft <= 0) {
      setMessage(language === 'pt' ? '⏰ Tempo esgotado! Você perdeu!' : '⏰ Time’s up! You lost!');
      setGameActive(false);
      forceEndGame(false);
    }
  
    return () => clearInterval(timer);
  }, [gameActive, timeLeft]);
  

  async function fetchLeaderboard() {
    if (!contract) return;
    try {
      const limit = 10;
      const [topPlayers, topPoints] = await contract.getLeaderboard(limit);
      const leaderboardData = topPlayers.map((player, index) => ({
        address: player,
        points: topPoints[index].toString(),
      }));
      setLeaderboard(leaderboardData);
    } catch (err) {
      console.error('Erro ao buscar leaderboard:', err);
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

  async function checkIfPlaying() {
    if (!contract || !account) return false;
    try {
      const player = await contract.players(account);
      return player.isPlaying;
    } catch (err) {
      console.error('Erro ao verificar estado do jogador:', err);
      return false;
    }
  }

  useEffect(() => {
    if (contract) {
      fetchLeaderboard();
      checkOwner();
      checkIfPlaying().then(isPlaying => {
        setGameActive(isPlaying);
      });
    }
  }, [contract, account]);

  async function loadWords(lang) {
    const file = lang === 'pt' ? '/words_pt.json' : '/words.json';
    fetch(file)
      .then(res => res.json())
      .then(data => setWords(data));
  }

  async function connectWallet() {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const _provider = new ethers.BrowserProvider(window.ethereum);
        const _signer = await _provider.getSigner();
        const _contract = new ethers.Contract(contractAddress, contractABI, _signer);
        const address = await _signer.getAddress();

        const fee = await _contract.getEntryFee();
        const formattedFee = fee ? ethers.formatEther(fee) : "0";

        setProvider(_provider);
        setSigner(_signer);
        setContract(_contract);
        setAccount(address);
        setEntryFee(formattedFee);
      } catch (err) {
        console.error('Erro ao conectar carteira:', err);
      }
    } else {
      alert('MetaMask não detectado!');
    }
  }

  async function startGame() {
    if (!contract) return;
    try {
      const isPlaying = await checkIfPlaying();
      if (isPlaying) {
        alert(language === 'pt'
          ? 'Você já está em um jogo ativo. Finalize o jogo atual antes de iniciar outro.'
          : 'You are already in an active game. Finish the current game before starting another.');
        return;
      }
      const feeInWei = ethers.parseEther(entryFee);
      const tx = await contract.startGame({ value: feeInWei });
      await tx.wait();
      loadWord();
      setGameActive(true);
      setTimeLeft(60);
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
      const tx = await contract.endGame(won, wordLength);
      await tx.wait();
      setGameActive(false);
      setTimeLeft(0);
      fetchLeaderboard();
    } catch (err) {
      console.error('Erro ao forçar finalização do jogo:', err);
      alert('Erro ao forçar finalização do jogo: ' + err.message);
    }
  }

  function loadWord() {
    const wordObj = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(wordObj.palavra);
    setCurrentHint(wordObj.dica);
    setMaskedWord('_ '.repeat(wordObj.palavra.length));
    setChances(wordObj.palavra.length <= 6 ? 3 : wordObj.palavra.length <= 9 ? 4 : 5);
    setUsedLetters([]);
    setMessage('');
  }
  

  async function handleGuess(letter) {
    if (!gameActive || usedLetters.includes(letter) || message) return;
    setUsedLetters(prev => [...prev, letter]);
    if (!currentWord.includes(letter)) {
      setChances(prev => prev - 1);
      if (chances - 1 <= 0) {
        setMessage('❌ ' + (language === 'pt' ? 'Você perdeu!' : 'You lost!'));
        setGameActive(false);
        setTimeLeft(0);
        try {
          const tx = await contract.endGame(false, currentWord.length);
          await tx.wait();
          fetchLeaderboard();
        } catch (err) {
          console.error('Erro ao registrar derrota:', err);
        }
        return;
      }
      return;
    }
    const updated = maskedWord.split(' ').map((char, i) => (currentWord[i] === letter ? letter : char));
    setMaskedWord(updated.join(' '));
    if (!updated.includes('_')) {
      setMessage('✅ ' + (language === 'pt' ? 'Você venceu!' : 'You won!'));
      setGameActive(false);
      setTimeLeft(0);
      try {
        const tx = await contract.endGame(true, currentWord.length);
        await tx.wait();
        alert('Parabéns! Você recebeu ' + ethers.formatEther(await contract.rewardAmount()) + ' MON');
        fetchLeaderboard();
      } catch (err) {
        console.error('Erro ao registrar vitória:', err);
      }
    }
  }

  function renderLetters() {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    return alphabet.map(letter => (
      <button
        key={letter}
        className="letter-button"
        onClick={() => handleGuess(letter)}
        disabled={usedLetters.includes(letter) || message || !gameActive}
      >
        {letter.toUpperCase()}
      </button>

    ));
  }

  function renderChances() {
    const total = currentWord.length <= 6 ? 3 : currentWord.length <= 9 ? 4 : 5;
    return (
      <p>
        {translations[language].chances}: {'🔴'.repeat(chances)}{'⚪'.repeat(total - chances)}
      </p>
    );
  }

  function renderTimer() {
    if (!gameActive) return null;
    return (
      <p>
        {translations[language].timeLeft}: {timeLeft} {language === 'pt' ? 'segundos' : 'seconds'}
      </p>
    );
  }

  function renderLeaderboard() {
    if (leaderboard.length === 0) {
      return <p>{language === 'pt' ? 'Nenhum jogador no leaderboard ainda.' : 'No players in the leaderboard yet.'}</p>;
    }
    return (
      <div style={{ marginTop: '20px' }}>
        <h2>{translations[language].leaderboard}</h2>
        <table style={{ margin: '0 auto', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid black', padding: '5px' }}>{language === 'pt' ? 'Posição' : 'Rank'}</th>
              <th style={{ border: '1px solid black', padding: '5px' }}>{language === 'pt' ? 'Endereço' : 'Address'}</th>
              <th style={{ border: '1px solid black', padding: '5px' }}>{language === 'pt' ? 'Pontos' : 'Points'}</th>
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
  }

  return (
    <div className="main-container">
      <div className="game-section">
        <h1>Forca Web3</h1>
        <div>
          <button className="action-button" onClick={() => setLanguage('pt')}>Português</button>
          <button className="action-button" onClick={() => setLanguage('en')}>English</button>
        </div>
        {!account ? (
          <button className="action-button" onClick={connectWallet} style={{ marginTop: '10px' }}>
            {translations[language].connect}
          </button>
        ) : (
          <>
            <p className="account-info">Usuário conectado: {account.slice(0, 4)}...{account.slice(-3)}</p>
            <button className="action-button" onClick={startGame} style={{ marginTop: '10px' }}>
              {translations[language].start}
            </button>
            <p className="hint"><strong>Dica:</strong> {currentHint}</p>

            {gameActive && (
              <div style={{ marginTop: '10px' }}>
                
                <button className="action-button" onClick={() => forceEndGame(false)}>
                  {language === 'pt' ? 'Forçar Derrota' : 'Force Loss'}
                </button>
              </div>
            )}
          </>
        )}
        <p className="masked-word">{maskedWord}</p>
        {renderChances()}
        {renderTimer()}
        <div style={{ margin: '10px' }}>{renderLetters()}</div>
        <p className="message">{message}</p>
      </div>
  
      <div className="leaderboard-section">
        {renderLeaderboard()}
      </div>
    </div>
  );
  
}

export default App;
