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
    ProgressBar,
    fetchLeaderboard,
    provider,
  } = useContext(GlobalContext);

  const [currentWord, setCurrentWord] = useState('');
  const [maskedWord, setMaskedWord] = useState('');
  const [chances, setChances] = useState(0);
  const [message, setMessage] = useState('');
  const [usedLetters, setUsedLetters] = useState([]);
  const [entryFee, setEntryFee] = useState('0');
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
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
        let adjustedFee;
        switch (gameMode) {
          case 'easy':
            adjustedFee = '0.1';
            break;
          case 'normal':
            adjustedFee = '0.1';
            break;
          case 'hardcore':
            adjustedFee = '0.1';
            break;
          default:
            adjustedFee = '0.1';
        }
        setEntryFee(adjustedFee);
        console.log(`Entry fee for ${gameMode}: ${adjustedFee} Ether`);
      } catch (err) {
        console.error('Erro ao definir entryFee:', err);
        setMessage(translations[language].pt ? '❌ Erro ao carregar taxa de entrada.' : '❌ Error loading entry fee.');
      }
    }
    fetchEntryFee();
  }, [contract, language, translations, gameMode]);

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
      setMessage(translations[language].pt ? '❌ Erro ao verificar estado do jogador.' : '❌ Error checking player status.');
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
      console.log(`Pass NFT price: ${ethers.formatEther(passNFTPrice)} Ether`);
      const tx = await contract.buyAndMintPass({ value: passNFTPrice });
      await tx.wait();
      setMessage(translations[language].pt ? '✅ Pass NFT comprado com sucesso!' : '✅ Pass NFT purchased successfully!');
    } catch (err) {
      console.error('Erro ao comprar Pass NFT:', err);
      setMessage(translations[language].pt ? '❌ Erro ao comprar Pass NFT: ' + err.message : '❌ Error purchasing Pass NFT: ' + err.message);
    }
  }

  async function startGame() {
    console.log('startGame chamado', { account, contract: !!contract, provider: !!provider, gameMode });
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
      //taxa inicial de entrada
      console.log('Verificando saldo...');
      let feeInWei;
      switch (gameMode) {
        case 'easy':
          feeInWei = ethers.parseEther('0.1');
          break;
        case 'normal':
          feeInWei = ethers.parseEther('0.1');
          break;
        case 'hardcore':
          feeInWei = ethers.parseEther('0.1');
          break;
        default:
          feeInWei = ethers.parseEther('0.1');
      }
      console.log(`Entry Fee (wei): ${feeInWei.toString()}`);
      
      const balance = await provider.getBalance(account);
      console.log(`User balance (Ether): ${ethers.formatEther(balance)}`);
      if (balance < feeInWei) {
        console.log('Saldo insuficiente');
        setMessage(translations[language].pt ? '💰 Você está sem saldo para iniciar uma partida.' : '💰 You have insufficient balance to start a game.');
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

      setTimeLeft(useHint ? 30 : 45);
      setHintLocked(useHint);
      setGameActive(true);
      fetchLeaderboard();
    } catch (err) {
      console.error('Erro ao iniciar o jogo:', err);
      if (err.reason && err.reason.includes('Daily play limit reached')) {
        setMessage(
          translations[language].pt
            ? '⛔ Você atingiu o limite de partidas diárias, volte amanhã ou compre um Pass NFT para ter mais partidas.'
            : '⛔ You have reached the daily game limit. Come back tomorrow or buy a Pass NFT for more games.'
        );
      } else if (err.message.includes('insufficient funds') || err.reason?.includes('Incorrect entry fee')) {
        setMessage(translations[language].pt ? '💰 Você está sem saldo para iniciar uma partida.' : '💰 You have insufficient balance to start a game.');
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
      setMessage(translations[language].pt ? '❌ Contrato ou conta não inicializados.' : '❌ Contract or account not initialized.');
      return;
    }

    setIsEndingGame(true);
    try {
      console.log('forceEndGame called', { won, currentWord, account, timeLeft, gameMode, useHint });

      if (!currentWord) {
        console.warn('currentWord is empty, defaulting to wordLength: 0');
      }

      const initialPlayerBalance = await provider.getBalance(account);
      const contractBalance = await provider.getBalance('0xBEa6E7c7c4375111C512d9966D2D75F0873d16Ab');
      console.log('Initial player balance (MON):', ethers.formatEther(initialPlayerBalance));
      console.log('Contract balance (MON):', ethers.formatEther(contractBalance));

      const initialPlayerData = await contract.players(account);
      console.log('Initial player state:', {
        points: initialPlayerData.points.toString(),
        gamesPlayed: initialPlayerData.gamesPlayed.toString(),
        isPlaying: initialPlayerData.isPlaying,
        nonce: initialPlayerData.nonce.toString(),
      });

      const playerNonce = initialPlayerData.nonce.toString();
      console.log('Current player nonce:', playerNonce);
      const wordLength = currentWord ? currentWord.length : 0;
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
      };

      console.log('Parameters sent to backend:', params);
        //'http://localhost:3001/sign-result'
        //'https://backend-assinatura-production.up.railway.app/sign-result'
      await fetch('/api/sign', {
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
      console.log('Recommended Gas Price (Gwei):', ethers.formatUnits(gasPrice, 'gwei'));

      const gasLimit = estimatedGas * 120n / 100n;
      console.log('Gas Limit:', gasLimit.toString());

      console.log('Calling endGame with:', endGameParams);
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
      console.log('Final player balance (MON):', ethers.formatEther(finalPlayerBalance));
      console.log('Balance difference (MON):', ethers.formatEther(finalPlayerBalance - initialPlayerBalance));

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
        const rewardInMon = ethers.formatEther(data.rewardAmount);
        const bonusMessage = !useHint
          ? translations[language].pt
            ? ' (inclui bônus de 20% por não usar dica)'
            : ' (includes 20% bonus for no hint)'
          : '';
        setMessage(
          translations[language].pt
            ? `✅ Você recebeu ${rewardInMon} MON e ${data.finalPoints} pontos!${bonusMessage}`
            : `✅ You received ${rewardInMon} MON and ${data.finalPoints} points!${bonusMessage}`
        );
      }

      setIsPlaying(false);
      setGameActive(false);
    } catch (error) {
      console.error('Error ending game:', error);
      setMessage(translations[language].pt ? '❌ Erro ao finalizar o jogo: ' + error.message : '❌ Error ending game: ' + error.message);
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
      if (!data || !data.palavra) {
        throw new Error('Palavra não encontrada no backend');
      }
      console.log('Loaded word:', data.palavra);
      
      setCurrentWord(data.palavra);
      setCurrentHint(data.dica || data.dica1 || '');
      setSecondHint(data.dica2 || '');
      setMaskedWord('_ '.repeat(data.palavra.length));
      setUsedLetters([]);
      setMessage('');

      const baseChances = data.palavra.length <= 6 ? 3 : data.palavra.length <= 9 ? 4 : 5;
      setChances(baseChances);

      return data.palavra;
    } catch (err) {
      console.error('Erro ao carregar palavra:', err);
      setMessage(translations[language].pt ? '❌ Erro ao carregar palavra: ' + err.message : '❌ Error loading word: ' + err.message);
      setCurrentWord('microfone');
      setCurrentHint('Um dispositivo de áudio');
      setSecondHint('Usado em gravações');
      setMaskedWord('_ '.repeat(9));
      setChances(4);
      return 'microfone';
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
    const wordLength = currentWord.length;
    const total = wordLength <= 6 ? 3 : wordLength <= 9 ? 4 : 5;
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
        <ProgressBar timeLeft={timeLeft} maxTime={hintLocked ? 30 : 45} />
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
          {gameActive && useHint && (
            <div className="hint">
              <p>
                <strong>{translations[language].pt ? 'Dica:' : 'Hint:'}</strong> {currentHint}
              </p>
              {timeLeft <= 30 && secondHint && (
                <p>
                  <strong>{translations[language].pt ? 'Dica 2:' : 'Hint 2:'}</strong> {secondHint}
                </p>
              )}
            </div>
          )}
          {gameActive && !useHint && (
            <p>{translations[language].pt ? 'Sem dica selecionada' : 'No hint selected'}</p>
          )}
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