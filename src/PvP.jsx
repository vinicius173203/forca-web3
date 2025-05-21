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

const PvP = ({ gameMode }) => {
  const {
    contract,
    account,
    language,
    translations,
    BACKEND_URL,
    renderMessage,
    ProgressBar,
  } = useContext(GlobalContext);

  const [currentWord, setCurrentWord] = useState('');
  const [maskedWord, setMaskedWord] = useState('');
  const [chances, setChances] = useState(0);
  const [message, setMessage] = useState('');
  const [usedLetters, setUsedLetters] = useState([]);
  const [entryFee, setEntryFee] = useState('0');
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [pvpMatchId, setPvPMatchId] = useState('');
  const [waitingForPvP, setWaitingForPvP] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const [currentMatchId, setCurrentMatchId] = useState(null);
  const [isPlayer1, setIsPlayer1] = useState(false);
  const [pvpPolling, setPvpPolling] = useState(false);
  const [pvpRedisMatchId, setPvpRedisMatchId] = useState(null);
  const [matchState, setMatchState] = useState({
    word: '',
    currentTurn: '',
    player1Chances: 6,
    player2Chances: 6,
    guesses: [],
    firstPlayer: '',
    countdown: 0,
    turnTimer: 0,
    winner: '',
    player2: '',
  });
  const [isMyTurn, setIsMyTurn] = useState(false);

  useEffect(() => {
    async function fetchEntryFee() {
      if (!contract) return;
      const modeIndex = modeEnum.pvp;
      const config = await contract.modeConfigs(modeIndex);
      const fee = ethers.formatEther(config.entryFee);
      setEntryFee(fee);
    }
    fetchEntryFee();
  }, [contract]);

  useEffect(() => {
    let interval;
    if (pvpPolling && pvpRedisMatchId) {
      interval = setInterval(fetchPvpState, 5000);
    }
    return () => clearInterval(interval);
  }, [pvpPolling, pvpRedisMatchId]);

  useEffect(() => {
    if (!waitingForPvP) return;
    const timer = setInterval(() => {
      setWaitingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [waitingForPvP]);

  useEffect(() => {
    if (!contract || !account || !isPlayer1 || !currentMatchId || gameActive) return;
    const interval = setInterval(async () => {
      try {
        const match = await contract.pvpMatches(currentMatchId);
        if (
          match.player1.toLowerCase() === account.toLowerCase() &&
          match.player2 !== ethers.ZeroAddress &&
          !match.player1Paid
        ) {
          clearInterval(interval);
          const fee = match.entryAmount;
          const tx = await contract.confirmPvPMatch(currentMatchId, { value: fee });
          await tx.wait();
          await loadWord();
          setWaitingForPvP(false);
          setGameActive(true);
          alert(
            translations[language].pt
              ? '✅ Partida PvP confirmada! Boa sorte!'
              : '✅ PvP match confirmed! Good luck!'
          );
        }
      } catch (err) {
        console.error('Erro ao confirmar PvP automaticamente:', err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [contract, account, isPlayer1, currentMatchId, gameActive]);

  async function checkActiveMatch() {
    try {
      const openMatchId = await contract.openPvPMatchId(account);
      if (openMatchId > 0) {
        const match = await contract.pvpMatches(openMatchId);
        if (match.active) {
          alert(
            translations[language].pt
              ? 'Você já tem uma partida PvP ativa. Cancele ou finalize a partida atual.'
              : 'You already have an active PvP match. Cancel or finish the current match.'
          );
          setCurrentMatchId(Number(openMatchId));
          setPvpRedisMatchId(`pvp:${openMatchId}`);
          setWaitingForPvP(match.player2 === ethers.ZeroAddress);
          setIsPlayer1(match.player1.toLowerCase() === account.toLowerCase());
          setPvpPolling(true);
          setMatchState((prev) => ({ ...prev, player2: match.player2 }));
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Error checking active match:', err);
      return false;
    }
  }

  async function findOpenMatch() {
    try {
      const res = await fetch(`${BACKEND_URL}/pvp/open-matches`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const data = await res.json();
      if (data.matchId && Number(data.matchId) > 0) {
        const matchId = Number(data.matchId);
        const match = await contract.pvpMatches(matchId);
        if (
          match.active &&
          match.player2 === ethers.ZeroAddress &&
          match.player1.toLowerCase() !== account.toLowerCase()
        ) {
          return matchId;
        }
      }
      const matchCounter = Number(await contract.pvpMatchCounter());
      for (let id = matchCounter; id > Math.max(1, matchCounter - 10); id--) {
        const match = await contract.pvpMatches(id);
        if (
          match.active &&
          match.player2 === ethers.ZeroAddress &&
          match.player1.toLowerCase() !== account.toLowerCase()
        ) {
          return id;
        }
      }
      return 0;
    } catch (err) {
      console.error('Error finding open match:', err);
      alert(
        translations[language].pt
          ? 'Erro ao buscar partidas abertas. Verifique se o backend está ativo em http://localhost:3005.'
          : 'Error fetching open matches. Check if the backend is running at http://localhost:3005.'
      );
      return 0;
    }
  }

  async function handlePvPStart() {
    if (!contract || !account) {
      alert(translations[language].pt ? 'Conecte a carteira primeiro!' : 'Connect wallet first!');
      return;
    }
    try {
      const hasActiveMatch = await checkActiveMatch();
      if (hasActiveMatch) return;

      let openMatchId = await findOpenMatch();
      if (openMatchId > 0) {
        const config = await contract.modeConfigs(modeEnum.pvp);
        const feeInWei = config.entryFee;
        let tx;
        try {
          tx = await contract.joinPvPMatch(openMatchId, { value: feeInWei });
          await tx.wait();
        } catch (err) {
          if (err.code === 'ACTION_REJECTED') {
            alert(
              translations[language].pt
                ? 'Transação rejeitada pelo usuário no MetaMask.'
                : 'Transaction rejected by user in MetaMask.'
            );
            return;
          }
          throw err;
        }

        let attempts = 3;
        let data;
        while (attempts > 0) {
          try {
            const res = await fetch(`${BACKEND_URL}/pvp/join`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address: account, lang: language, contractMatchId: openMatchId }),
            });
            if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
            data = await res.json();
            if (data.error) throw new Error(data.error);
            break;
          } catch (err) {
            console.error(`Join attempt ${4 - attempts} failed:`, err);
            attempts--;
            if (attempts === 0) throw err;
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        setPvpRedisMatchId(data.matchId || `pvp:${openMatchId}`);
        setCurrentMatchId(openMatchId);
        setIsPlayer1(false);
        setWaitingForPvP(false);
        setPvpPolling(true);
        setGameActive(true);
      } else {
        const tx = await contract.createPvPMatch();
        await tx.wait();
        const newId = await contract.pvpMatchCounter();
        const contractMatchId = Number(newId);

        const res = await fetch(`${BACKEND_URL}/pvp/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: account, lang: language, contractMatchId }),
        });
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setPvpRedisMatchId(data.matchId || `pvp:${contractMatchId}`);
        setCurrentMatchId(contractMatchId);
        setIsPlayer1(true);
        setWaitingForPvP(true);
        setPvpPolling(true);
      }
    } catch (err) {
      console.error('PvP Error:', err);
      alert(`Erro ao iniciar PvP: ${err.message}`);
    }
  }

  async function handleConfirmPvP() {
    try {
      if (!contract || !currentMatchId) throw new Error('No match to confirm');
      const config = await contract.modeConfigs(modeEnum.pvp);
      const feeInWei = config.entryFee;
      const tx = await contract.confirmPvPMatch(currentMatchId, { value: feeInWei });
      await tx.wait();
      setGameActive(true);
    } catch (err) {
      console.error('Confirm PvP Error:', err);
      alert(`Erro ao confirmar PvP: ${err.message}`);
    }
  }

  async function handleCancelPvP() {
    try {
      if (!contract || !currentMatchId) throw new Error('No active match to cancel');
      const tx = await contract.cancelPvPMatch(currentMatchId);
      await tx.wait();
      setPvpRedisMatchId('');
      setCurrentMatchId(0);
      setIsPlayer1(false);
      setWaitingForPvP(false);
      setPvpPolling(false);
      setGameActive(false);
      setMatchState({
        word: '',
        currentTurn: '',
        player1Chances: 6,
        player2Chances: 6,
        guesses: [],
        firstPlayer: '',
        countdown: 0,
        turnTimer: 0,
        winner: '',
        player2: '',
      });
    } catch (err) {
      console.error('Cancel PvP Error:', err);
      alert(`Erro ao cancelar PvP: ${err.message}`);
    }
  }

  async function loadWord() {
    try {
      if (!pvpRedisMatchId) throw new Error('MatchId PvP não encontrado.');
      const response = await fetch(`${BACKEND_URL}/get-word-pvp?matchId=${pvpRedisMatchId}&lang=${language}`);
      const data = await response.json();
      if (!data || !data.palavra) throw new Error('Palavra não encontrada no backend PvP');
      setCurrentWord(data.palavra);
      setMaskedWord('_ '.repeat(data.palavra.length));
      setUsedLetters([]);
      setMessage('');
      setChances(5);
    } catch (err) {
      console.error('Erro ao carregar palavra:', err);
      alert(translations[language].pt ? 'Erro ao carregar palavra.' : 'Error loading word.');
    }
  }

  async function handleGuessPvp(letter) {
    if (!isMyTurn || !gameActive || !currentMatchId || !pvpRedisMatchId) return;
    try {
      // Adiciona a letra às usadas
      setUsedLetters((prev) => [...prev, letter]);
      const response = await fetch(`${BACKEND_URL}/pvp/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: pvpRedisMatchId,
          player: account,
          letter: letter.toLowerCase(),
        }),
      });
      const data = await response.json();
      if (data.error) {
        // Remove a letra se der erro
        setUsedLetters((prev) => prev.filter((l) => l !== letter));
        alert(data.error);
        return;
      }
      setMaskedWord(data.maskedWord);
      setChances(data.chances);
      setIsMyTurn(false);
      if (data.message) setMessage(data.message);
      if (data.gameOver) {
        setGameActive(false);
        setPvpPolling(false);
        if (data.winner) {
          const signature = await fetch(`${BACKEND_URL}/pvp/sign-winner`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId: currentMatchId, winner: data.winner }),
          })
            .then((res) => res.json())
            .then((data) => data.signature);
          await resolvePvPMatch(currentMatchId, data.winner, signature);
        }
      }
    } catch (err) {
      console.error('Erro ao chutar letra no PvP:', err);
      setUsedLetters((prev) => prev.filter((l) => l !== letter)); // Remove a letra se der erro
      alert('Erro ao chutar letra: ' + err.message);
    }
  }

  async function resolvePvPMatch(matchId, winnerAddress, signature) {
    const tx = await contract.resolvePvPMatch(matchId, winnerAddress, signature);
    await tx.wait();
    alert('🏆 Partida PvP resolvida!');
  }

  async function fetchPvpState() {
    if (!pvpRedisMatchId || !pvpPolling) return;
    try {
      const res = await fetch(`${BACKEND_URL}/pvp/state?matchId=${pvpRedisMatchId}`);
      if (!res.ok) throw new Error('Erro na resposta do servidor');
      const match = await res.json();
      if (!match) {
        setPvpPolling(false);
        setMessage(translations[language].pt ? 'Partida não encontrada.' : 'Match not found.');
        return;
      }
      setMaskedWord(match.masked);
      setCurrentWord(match.word);
      setIsMyTurn(match.turn === account);
      setChances(match.chances?.[account] || 5);
      if (match.winner) {
        setGameActive(false);
        setPvpPolling(false);
        setMessage(
          match.winner === account
            ? translations[language].pt
              ? '✅ Você venceu!'
              : '✅ You won!'
            : translations[language].pt
            ? '❌ Você perdeu.'
            : '❌ You lost.'
        );
      }
    } catch (err) {
      console.error('Erro no polling PvP:', err);
      setPvpPolling(false);
      setMessage(translations[language].pt ? 'Erro ao atualizar partida.' : 'Error updating match.');
    }
  }

  const renderLetters = () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    return alphabet.map((letter) => (
      <button
        key={letter}
        className={`letter-button ${usedLetters.includes(letter) ? 'used' : ''}`}
        onClick={() => handleGuessPvp(letter)}
        disabled={usedLetters.includes(letter) || message || !gameActive || !isMyTurn}
      >
        {letter.toUpperCase()}
      </button>
    ));
  };

  const renderChances = () => {
    if (!currentWord) return null;
    const safeChances = Math.max(0, chances);
    return (
      <p>
        {translations[language].chances}: {'🔴'.repeat(safeChances)}
      </p>
    );
  };

  const renderTimer = () => {
    if (!gameActive) return null;
    return (
      <p>
        {translations[language].timeLeft}: {timeLeft} {translations[language].pt ? 'segundos' : 'seconds'}
        <ProgressBar timeLeft={timeLeft} maxTime={60} />
      </p>
    );
  };

  async function testPvpMatches(matchId) {
    if (!contract) {
      alert(translations[language].pt ? 'Contrato não inicializado!' : 'Contract not initialized!');
      return;
    }
    try {
      const match = await contract.pvpMatches(matchId);
      console.log(`pvpMatches(${matchId}):`, match);
    } catch (err) {
      console.error(`pvpMatches error:`, err);
      alert(
        translations[language].pt
          ? `Erro ao buscar pvpMatches(${matchId}): ${err.message}`
          : `Error fetching pvpMatches(${matchId}): ${err.message}`
      );
    }
  }

  return (
    <div className="game-section">
      <div style={{ marginTop: '10px' }}>
            <label>
              {translations[language].pt ? 'Em Breve' : 'Em Breve'}
            </label>
          </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '10px' }}>
            <img src="/forca.png" alt="Forca" style={{ width: '130px', marginRight: '20px' }} />
            <img src="/forca.png" alt="Forca" style={{ width: '130px', marginLeft: '20px' }} />
      </div>
      
      {account && (
        <>
          {!gameActive && !waitingForPvP && !currentMatchId && (
            <button className="action-button" disabled={handlePvPStart}>
              {translations[language].pt ? 'Começar Jogo' : 'Começar Jogo'}
            </button>
          )}
          {waitingForPvP && (
            <div style={{ marginTop: '10px' }}>
              <p>
                ⏳{' '}
                {translations[language].pt
                  ? `Aguardando adversário... (${waitingSeconds}s)`
                  : `Waiting for opponent... (${waitingSeconds}s)`}
              </p>
              <button className="action-button" onClick={handleCancelPvP}>
                {translations[language].pt ? 'Cancelar Partida' : 'Cancel Match'}
              </button>
            </div>
          )}
          {isPlayer1 && currentMatchId && !waitingForPvP && !gameActive && matchState.player2 && (
            <button className="action-button" onClick={handleConfirmPvP}>
              {translations[language].pt ? 'Confirmar e Pagar' : 'Confirm and Pay'}
            </button>
          )}
          <div style={{ marginTop: '10px' }}>
            {/* Sempre renderizar os botões das letras, mas desabilitar até que o jogo comece */}
            <div style={{ margin: '10px' }}>{renderLetters()}</div>

            {(gameActive || matchState.countdown > 0) && (
              <>
                {matchState.countdown > 0 ? (
                  <p>
                    {translations[language].pt
                      ? `Iniciando em ${matchState.countdown} segundos`
                      : `Starting in ${matchState.countdown} seconds`}
                  </p>
                ) : (
                  <>
                    <p className="masked-word">{maskedWord}</p>
                    <p
                      style={{
                        fontWeight: 'bold',
                        color: matchState.currentTurn.toLowerCase() === account.toLowerCase() ? 'lime' : 'orange',
                      }}
                    >
                      {matchState.currentTurn.toLowerCase() === account.toLowerCase()
                        ? translations[language].pt
                          ? 'É sua vez!'
                          : 'Your turn!'
                        : translations[language].pt
                        ? 'Aguardando oponente...'
                        : 'Waiting opponent...'}
                    </p>
                    {renderChances()}
                    {renderTimer()}
                    <p>
                      {translations[language].pt ? 'Chances do adversário:' : 'Opponent chances:'}{' '}
                      {isPlayer1 ? matchState.player2Chances : matchState.player1Chances}
                    </p>
                    {matchState.winner && (
                      <p style={{ fontWeight: 'bold', color: 'gold' }}>
                        {translations[language].pt ? 'Vencedor: ' : 'Winner: '}
                        {matchState.winner.toLowerCase() === account.toLowerCase() ? 'Você' : 'Adversário'}
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
          <p className="message">{renderMessage(message)}</p>
        </>
      )}
    </div>
  );
};

export default PvP; 