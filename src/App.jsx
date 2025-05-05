import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import rawContract from './ForcaGame.json';
const contractABI = rawContract.abi;
import './App.css';


const contractAddress = '0x274Ec0b6E7cd0C3A52F359e33e66A38CdC1f4C05'; // Atualize se mudar o endereço!

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
  const [useHint, setUseHint] = useState(true);
  const translations = {
    pt: { start: 'Começar Jogo', restart: 'Recomeçar', chances: 'Tentativas restantes', connect: 'Conectar Carteira', leaderboard: 'Tabela de Classificação', timeLeft: 'Tempo Restante' },
    en: { start: 'Start Game', restart: 'Restart', chances: 'Chances left', connect: 'Connect Wallet', leaderboard: 'Leaderboard', timeLeft: 'Time Left' }
  };


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
  
  async function fetchLeaderboard() {
    try {
        const response = await fetch('https://backend-leaderboard-production.up.railway.app/leaderboard');
        const data = await response.json();

        const leaderboardData = data.map((item, index) => ({
            address: item.address,
            points: item.points.toString(),
        }));

        setLeaderboard(leaderboardData);
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


  async function connectWallet() {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const _provider = new ethers.BrowserProvider(window.ethereum);
        const _signer = await _provider.getSigner();
        const _contract = new ethers.Contract(contractAddress, contractABI, _signer);
        const address = await _signer.getAddress();

        const fee = await _contract.entryFee();
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
      setTimeLeft(useHint ? 30 : 45);
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
      const completedInSeconds = 60 - timeLeft;

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
          initialTime: useHint ? 30 : 45  // NOVO campo enviado

        })
      });
      

      const { finalPoints, signature } = await response.json();

      const tx = await contract.endGame(won, wordLength, tokenId, finalPoints, signature);
      await tx.wait();

      setGameActive(false);
      setTimeLeft(0);
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

  const BACKEND_URL = 'https://palavras-production.up.railway.app';



  async function loadWord() {
      try {
        const response = await fetch(`${BACKEND_URL}/get-word?lang=${language}&wallet=${account}`);

          const data = await response.json();
  
          setCurrentWord(data.palavra);
          setCurrentHint(data.dica);
          setMaskedWord('_ '.repeat(data.palavra.length));
          setChances(data.palavra.length <= 6 ? 3 : data.palavra.length <= 9 ? 4 : 5);
          setUsedLetters([]);
          setMessage('');
      } catch (err) {
          console.error('Erro ao buscar palavra do backend:', err);
          alert(language === 'pt' ? 'Erro ao carregar palavra do servidor.' : 'Error loading word from server.');
      }
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
        await forceEndGame(false);
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
      await forceEndGame(true);
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
    <>
      {/* Topo direito: usuário + conectar/desconectar */}
      <div style={{ position: 'absolute', top: '10px', right: '20px', textAlign: 'right' }}>
        {!account ? (
          <button
            className="action-button"
            onClick={connectWallet}
          >
            {translations[language].connect}
          </button>
        ) : (
          <>
            <p>👤 {account.slice(0, 6)}...{account.slice(-4)}</p>
            <button
              className="action-button"
              onClick={() => {
                setAccount('');
                setContract(null);
                setSigner(null);
                setProvider(null);
              }}
            >
              {language === 'pt' ? 'Desconectar' : 'Disconnect'}
            </button>
          </>
        )}
      </div>
  
      <div className="main-container">
        <div className="game-section">
          <h1>Forca Web3</h1>
          <div>
            <button className="action-button" onClick={() => setLanguage('pt')}>Português</button>
            <button className="action-button" onClick={() => setLanguage('en')}>English</button>
          </div>
  
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
                  {language === 'pt' ? ' Jogar com dica' : ' Play with hint'}
                </label>
              </div>
  
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '10px' }}>
                <img src="/forca.png" alt="Forca" style={{ width: '170px', marginRight: '20px' }} />
                <button className="action-button" onClick={startGame}>
                  {translations[language].start}
                </button>
                <img src="/forca.png" alt="Forca" style={{ width: '170px', marginLeft: '20px' }} />
              </div>
              <p className="hint">
                <strong>Dica:</strong> {useHint ? currentHint : (language === 'pt' ? 'Sem dica selecionada' : 'No hint selected')}
              </p>
  
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
  
      <div style={{ width: '90%', maxWidth: '1200px', margin: '30px auto', padding: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '15px', textAlign: 'center' }}>
      <h2>🕹️ Como Jogar Forca Web3</h2>
      <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>
        Conecte sua carteira e prepare-se para desafiar seu cérebro!<br />
        Você precisa adivinhar a palavra secreta, letra por letra, antes que o tempo acabe ou as tentativas terminem.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, fontSize: '1.1rem', textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
        <li>✅ Escolha o idioma (Português/English)</li>
        <li>✅ Decida se quer usar dica (mais fácil, mas menos pontos)</li>
        <li>✅ Comece o jogo e clique ou digite letras para chutar</li>
        <li>✅ Complete a palavra e ganhe pontos no leaderboard on-chain!</li>
      </ul>
      <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
        Os resultados são assinados no backend para garantir que ninguém roube pontos — Web3 de verdade! 🌐
      </p>

      <h2 style={{ marginTop: '30px' }}>🎯 Quantos Pontos Vale Cada Palavra?</h2>
      <ul style={{ listStyle: 'none', padding: 0, fontSize: '1.1rem' }}>
        <li>🔹 Até 6 letras → <strong>3 pontos base</strong></li>
        <li>🔹 Até 9 letras → <strong>4 pontos base</strong></li>
        <li>🔹 Mais de 9 letras → <strong>5 pontos base</strong></li>
      </ul>

      <h2 style={{ marginTop: '30px' }}>🚀 Multiplicadores Ativos</h2>
      <ul style={{ listStyle: 'none', padding: 0, fontSize: '1.1rem' }}>
        <li>🎯 Sem dica → <strong>2x pontos!</strong></li>
        <li>⏱️ Resolver rápido (menos de 15s) → <strong>+20% bônus!</strong></li>
        <li>🧠 Palavra longa (mais de 15 letras) → <strong>+20% bônus!</strong></li>
      
      </ul>

      <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
        Jogue como um verdadeiro caçador de bônus na Monad testnet! 🎮✨
      </p>
    </div>

    

    </>
  );
  
}

export default App;
