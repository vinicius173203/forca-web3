import React, { useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import { GlobalContext } from './Global.jsx';

const NormalHardcore = ({ gameMode }) => {
  const {
    contract,
    account,
    language,
    translations,
    BACKEND_UR,
    renderMessage,
    LEADBOARD,
    ProgressBar,
    provider,
    currentNetwork,
    contractAddress,
  } = useContext(GlobalContext);

  const [maskedWord, setMaskedWord] = useState('');
  const [chances, setChances] = useState(0);
  const [message, setMessage] = useState('');
  const [usedLetters, setUsedLetters] = useState([]);
  const [entryFee, setEntryFee] = useState('0');
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(gameMode === 'hardcore' ? 60 : gameMode === 'normal' ? 30 : 20);
  const [currentHint, setCurrentHint] = useState('');
  const [useHint, setUseHint] = useState(true);
  const [secondHint, setSecondHint] = useState('');
  const [pendingEnd, setPendingEnd] = useState(null);
  const [hintLocked, setHintLocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEndingGame, setIsEndingGame] = useState(false);

  useEffect(() => {
    async function fetchEntryFee() {
      if (!contract) {
        console.log('Contrato não inicializado');
        return;
      }
      try {
        const feeInWei = await contract.entryFee();
        const fee = ethers.formatEther(feeInWei);
        setEntryFee(fee);
        console.log(`Entry fee for ${gameMode} on ${currentNetwork}: ${fee} ${currentNetwork === 'somnia' ? 'STT' : 'MON'}`);
      } catch (err) {
        console.error('Erro ao definir entryFee:', err);
        setMessage(translations[language].pt ? '❌ Erro ao carregar taxa de entrada.' : '❌ Error loading entry fee.');
      }
    }
    fetchEntryFee();
  }, [contract, language, translations, gameMode, currentNetwork]);

  useEffect(() => {
    let timer;
    const tickSound = new Audio('/sounds/tick.wav');
    const warningSound = new Audio('/sounds/warning.wav');

    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          if (newTime <= 10) {
            warningSound.play().catch(() => {});
          } else {
            tickSound.play().catch(() => {});
          }
          return newTime;
        });
      }, 1000);
    } else if (gameActive && timeLeft <= 0 && !pendingEnd) {
      setMessage(translations[language].pt ? '⏰ Tempo esgotado! Você perdeu!' : '⏰ Time’s up! You lost!');
      setGameActive(false);
      setPendingEnd({ won: false });
    }

    return () => clearInterval(timer);
  }, [gameActive, timeLeft, pendingEnd, language]);

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
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameActive, usedLetters]);

  async function checkIfPlaying() {
    if (!contract || !account) {
      console.log('Contrato ou conta não inicializados');
      return false;
    }
    try {
      const player = await contract.players(account);
      const isPlaying = player.isPlaying;
      console.log(`checkIfPlaying: ${account} isPlaying: ${isPlaying}`);
      setIsPlaying(isPlaying);
      return isPlaying;
    } catch (err) {
      console.error('Erro ao verificar estado do jogador:', err);
      setMessage(translations[language].pt ? ' Bem vindo ao Forca Game'             : '  Welcome to Forca Game');
      return false;
    }
  }

  useEffect(() => {
    if (contract && account) {
      checkIfPlaying();
    }
  }, [contract, account, language, translations]);

  async function buyPassNFT() {
    if (!contract) {
      console.log('Contrato não inicializado para buyPassNFT');
      return;
    }
    try {
      const passNFTPrice = await contract.passNFTPrice();
      console.log(`Pass NFT price: ${ethers.formatEther(passNFTPrice)} ${currentNetwork === 'somnia' ? 'STT' : 'MON'}`);
      const tx = await contract.buyAndMintPass({ value: passNFTPrice });
      await tx.wait();
      setMessage(translations[language].pt ? '✅ Pass NFT comprado com sucesso!' : '✅ Pass NFT purchased successfully!');
    } catch (err) {
      console.error('Erro ao comprar Pass NFT:', err);
      setMessage(translations[language].pt ? '❌ Erro ao comprar Pass NFT: ' + err.message : '❌ Error purchasing Pass NFT: ' + err.message);
    }
  }

  async function startGame() {
    console.log('startGame chamado', {
      account,
      contract: !!contract,
      provider: !!provider,
      gameMode,
      currentNetwork,
      contractAddress,
    });

    if (!contract || !provider) {
      console.error('Contrato ou provedor não inicializado');
      setMessage(translations[language].pt ? '❌ Contrato ou provedor não inicializado.' : '❌ Contract or provider not initialized.');
      return;
    }

    try {
      console.log('Verificando se jogador está ativo...');
      const isPlaying = await checkIfPlaying();
      if (isPlaying) {
        console.log('Jogador já está em um jogo ativo');
        setMessage(
          translations[language].pt
            ? '⚠️ Você já está em um jogo ativo. Finalize o jogo atual antes de iniciar outro.'
            : '⚠️ You are already in an active game. Finish the current game before starting another.'
        );
        return;
      }

      const feeInWei = ethers.parseEther(entryFee);
      console.log(`Entry Fee (wei): ${feeInWei.toString()}`);

      const balance = await provider.getBalance(account);
      console.log(`User balance (${currentNetwork === 'somnia' ? 'STT' : 'MON'}): ${ethers.formatEther(balance)}`);

      if (balance < feeInWei) {
        console.log('Saldo insuficiente');
        setMessage(
          translations[language].pt
            ? `💰 Você está sem saldo para iniciar uma partida (Necessário: ${entryFee} ${currentNetwork === 'somnia' ? 'STT' : 'MON'}).`
            : `💰 You have insufficient balance to start a game (Required: ${entryFee} ${currentNetwork === 'somnia' ? 'STT' : 'MON'}).`
        );
        return;
      }

      console.log('Iniciando jogo...');
      const tx = await contract.startGame({ value: feeInWei, gasLimit: 300000 });
      console.log('Transação enviada:', tx.hash);
      await tx.wait();
      console.log('Transação confirmada');

      const loadedWord = await loadWord();
      if (!loadedWord) {
        console.error('Falha ao carregar palavra, abortando início do jogo');
        setMessage(translations[language].pt ? '❌ Erro ao carregar palavra do jogo.' : '❌ Error loading game word.');
        return;
      }

      setTimeLeft(gameMode === 'hardcore' ? 60 : gameMode === 'normal' ? 30 : 20);
      setHintLocked(useHint);
      setGameActive(true);
    } catch (err) {
      console.error('Erro ao iniciar o jogo:', err);
      if (err.reason && err.reason.includes('Daily play limit reached')) {
        setMessage(
          translations[language].pt
            ? '⛔ Você atingiu o limite de partidas diárias, volte amanhã ou compre um Pass NFT para ter mais partidas.'
            : '⛔ You have reached the daily game limit. Come back tomorrow or buy a Pass NFT for more games.'
        );
      } else if (err.message.includes('insufficient funds') || err.reason?.includes('Incorrect entry fee')) {
        setMessage(
          translations[language].pt
            ? `💰 Você está sem saldo para iniciar uma partida (Necessário: ${entryFee} ${currentNetwork === 'somnia' ? 'STT' : 'MON'}).`
            : `💰 You have insufficient balance to start a game (Required: ${entryFee} ${currentNetwork === 'somnia' ? 'STT' : 'MON'}).`
        );
      } else if (err.code === -32002) {
        setMessage(translations[language].pt ? '❌ MetaMask: Solicitação pendente. Verifique sua carteira.' : '❌ MetaMask: Request pending. Check your wallet.');
      } else {
        setMessage(translations[language].pt ? '❌ Erro ao iniciar o jogo: ' + err.message : '❌ Error starting game: ' + err.message);
      }
    }
  }

  async function forceEndGame(won) {
    if (!contract || !account) {
      console.error('Contrato ou conta não inicializados');
      setMessage(
        translations[language].pt
          ? '❌ Contrato ou conta não inicializados.'
          : '❌ Contract or account not initialized.'
      );
      return;
    }

    setIsEndingGame(true);
    try {
      console.log('forceEndGame called', { won, account, timeLeft, gameMode, useHint, contractAddress });

      const initialPlayerBalance = await provider.getBalance(account);
      const contractBalance = await provider.getBalance(contractAddress);
      console.log(`Initial player balance (${currentNetwork === 'somnia' ? 'STT' : 'MON'}): ${ethers.formatEther(initialPlayerBalance)}`);
      console.log(`Contract balance (${currentNetwork === 'somnia' ? 'STT' : 'MON'}): ${ethers.formatEther(contractBalance)}`);

      const initialPlayerData = await contract.players(account);
      console.log('Initial player state:', {
        points: initialPlayerData.points.toString(),
        gamesPlayed: initialPlayerData.gamesPlayed.toString(),
        isPlaying: initialPlayerData.isPlaying,
        nonce: initialPlayerData.nonce.toString(),
      });
      const playerNonce = initialPlayerData.nonce.toString();
      console.log('Current player nonce:', playerNonce);
      const wordLength = maskedWord ? maskedWord.split(' ').length : 0;
      const params = {
        player: ethers.getAddress(account),
        won,
        wordLength,
        tokenId: 0,
        finalPoints: 0,
        nonce: playerNonce,
        gameMode,
        chances,
        useHint,
        network: currentNetwork,
        entryFee,
      };
      console.log('Parameters sent to backend:', params);
      const ASSINATURA= import.meta.env.VITE_APP_ASSINATURA; //ASSINATURA
      const response = await fetch(`${ASSINATURA}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Backend response:', data);

      if (!data.signature || data.rewardAmount === undefined) {
        throw new Error('Invalid backend response: missing signature or rewardAmount');
      }

      const endGameParams = {
        won,
        wordLength,
        tokenId: 0,
        finalPoints: data.finalPoints,
        rewardAmount: data.rewardAmount.toString(),
        signature: data.signature,
      };

      const estimatedGas = await contract.endGame.estimateGas(
        endGameParams.won,
        endGameParams.wordLength,
        endGameParams.tokenId,
        endGameParams.finalPoints,
        endGameParams.rewardAmount,
        endGameParams.signature
      );
      console.log('Estimated Gas:', estimatedGas.toString());

      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('10', 'gwei');

      const gasLimit = estimatedGas * 120n / 100n;
      const tx = await contract.endGame(
        endGameParams.won,
        endGameParams.wordLength,
        endGameParams.tokenId,
        endGameParams.finalPoints,
        endGameParams.rewardAmount,
        endGameParams.signature,
        {
          gasLimit,
          gasPrice,
        }
      );
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction receipt:', receipt);

      const events = receipt.logs
        .map(log => {
          try {
            return contract.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .filter(event => event);
      console.log('Events emitted:', events.map(event => ({
        name: event.name,
        args: Object.fromEntries(
          Object.entries(event.args).map(([k, v]) => [
            k,
            typeof v === 'bigint' ? ethers.formatEther(v) : v.toString()
          ])
        ),
      })));

      const finalPlayerBalance = await provider.getBalance(account);

      const finalPlayerData = await contract.players(account);
      console.log('Final player state:', {
        points: finalPlayerData.points.toString(),
        gamesPlayed: finalPlayerData.gamesPlayed.toString(),
        isPlaying: finalPlayerData.isPlaying,
        nonce: finalPlayerData.nonce.toString(),
      });

      if (!won) {
        setMessage(
          translations[language].pt
            ? '❌ Você perdeu! Nenhuma recompensa ou pontos ganhos.'
            : '❌ You lost! No rewards or points earned.'
        );
      } else {
        const rewardInToken = ethers.formatEther(data.rewardAmount);
        const bonusMessage = !useHint
          ? translations[language].pt
            ? ' (inclui bônus de 20% por não usar dica)'
            : ' (includes 20% bonus for no hint)'
          : '';
        setMessage(
          translations[language].pt
            ? `✅ Você recebeu ${rewardInToken} ${currentNetwork === 'somnia' ? 'STT' : 'MON'} e ${data.finalPoints} pontos!${bonusMessage}`
            : `✅ You received ${rewardInToken} ${currentNetwork === 'somnia' ? 'STT' : 'MON'} and ${data.finalPoints} points!${bonusMessage}`
        );
      }

      setIsPlaying(false);
      setGameActive(false);
      // Salva playpoints no backend
try {
  const res = await fetch(`${LEADBOARD}/save-playpoints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet: account,
      network: currentNetwork,
      playpoints: finalPlayerData.points.toString(),
      timestamp: new Date().toISOString()
    })
  });

  if (!res.ok) {
    console.error('Erro ao salvar playpoints:', await res.text());
  } else {
    console.log('Playpoints salvos com sucesso!');
  }
} catch (err) {
  console.error('Erro ao enviar playpoints:', err);
}

    } catch (error) {
      console.error('Error ending game:', error);
      if (error?.data?.message?.includes('No balance') || error?.reason?.includes('No balance')) {
        setMessage(
          translations[language].pt
            ? '❌ O contrato está sem saldo, aguarde uma nova pool para continuar jogando.'
            : '❌ The contract has no balance, please wait for a new pool to continue playing.'
        );
      } else {
        setMessage(
          translations[language].pt
            ? '❌ Erro ao finalizar o jogo: ' + error.message
            : '❌ Error ending game: ' + error.message
        );
      }
    } finally {
      setIsEndingGame(false);
    }
  }

  async function loadWord() {
    try {
      const response = await fetch(`${BACKEND_UR}/get-word?lang=${language}&wallet=${account}&mode=${gameMode}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch word: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data || !data.maskedWord) {
        throw new Error('Palavra não encontrada no backend');
      }


      setMaskedWord(data.maskedWord);
      setCurrentHint(data.dica || data.dica1 || '');
      setSecondHint(data.dica2 || '');
      setChances(data.chances);
      setUsedLetters([]);
      setMessage('');

      return data.maskedWord;
    } catch (err) {
      console.error('Erro ao carregar palavra:', err);
      setMessage(translations[language].pt ? '❌ Erro ao carregar palavra: ' + err.message : '❌ Error loading word: ' + err.message);
      setMaskedWord('_ '.repeat(9));
      setCurrentHint('Um dispositivo de áudio');
      setSecondHint('Usado em gravações');
      setChances(gameMode === 'hardcore' ? 6 : 4);
      return '_ '.repeat(9);
    }
  }

  async function handleGuess(letter) {
    if (!gameActive || usedLetters.includes(letter) || message) return;

    try {
      const response = await fetch(`${BACKEND_UR}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: account, lang: language, mode: gameMode, letter }),
      });

      if (!response.ok) {
        throw new Error(`Failed to guess: ${response.statusText}`);
      }

      const data = await response.json();
      

      setMaskedWord(data.maskedWord);
      setChances(data.chances);
      setUsedLetters((prev) => [...prev, letter]);
      if (data.message) {
        setMessage(data.message);
        setGameActive(false);
        setPendingEnd({ won: data.won });
      }
    } catch (err) {
      console.error('Erro ao processar palpite:', err);
      setMessage(translations[language].pt ? '❌ Erro ao processar palpite: ' + err.message : '❌ Error processing guess: ' + err.message);
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
    if (!maskedWord) return null;
    const total = gameMode === 'hardcore' ? 6 : (maskedWord.split(' ').length <= 6 ? 3 : maskedWord.split(' ').length <= 9 ? 4 : 5);
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
        <ProgressBar timeLeft={timeLeft} maxTime={gameMode === 'hardcore' ? 60 : gameMode === 'normal' ? 30 : 20} />
      </div>
    );
  };

  const renderHints = () => {
    if (!gameActive || !useHint) {
      return !useHint ? (
        <p>{translations[language].pt ? 'Sem dica selecionada' : 'No hint selected'}</p>
      ) : null;
    }

    const secondHintTime = gameMode === 'hardcore' ? 30 : 10;
    return (
      <div className="hint">
        <p>
          <strong>{translations[language].pt ? 'Dica:' : 'Hint:'}</strong> {currentHint}
        </p>
        {timeLeft <= secondHintTime && secondHint && (
          <p>
            <strong>{translations[language].pt ? 'Dica 2:' : 'Hint 2:'}</strong> {secondHint}
          </p>
        )}
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

          {!gameActive && (
            <button className="action-button" onClick={startGame} disabled={isPlaying}>
              {translations[language].start}
            </button>
          )}
          {isPlaying && !gameActive && (
            <button
              className="action-button"
              onClick={() => forceEndGame(false)}
              style={{ marginLeft: '10px' }}
              disabled={isEndingGame}
            >
              {translations[language].pt ? 'Finalizar Partida' : 'End Game'}
            </button>
          )}
          {message.includes('atingiu o limite de partidas diárias') && (
            <button
              className="action-button"
              onClick={buyPassNFT}
              style={{ marginLeft: '10px', backgroundColor: '#FFD700', color: '#000' }}
            >
              {translations[language].pt ? 'Comprar Pass NFT' : 'Buy Pass NFT'}
            </button>
          )}
          {renderHints()}
          <p className="masked-word">{maskedWord}</p>
          {renderChances()}
          {renderTimer()}
          <div style={{ margin: '10px' }}>{renderLetters()}</div>
          <div className="message">{renderMessage(message)}</div>
        </>
      )}
    </div>
  );
};

export default NormalHardcore;