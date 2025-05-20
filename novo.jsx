jsx
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import rawContract from './ForcaGame.json';

const contractABI = rawContract.abi;
const modeEnum = { facil: 0, normal: 1, hardcore: 2, pvp: 3 };
const BACKEND_URL = 'http://localhost:3005';
const contractAddress = '0xC545245C45599fc0Ed6Ab6ea2d5a08f24d1460D8';
const translations = {
  pt: { start: 'Iniciar Jogo' },
  en: { start: 'Start Game' }
};

function App() {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [language, setLanguage] = useState('pt');
  const [gameMode, setGameMode] = useState('normal');
  const [gameActive, setGameActive] = useState(false);
  const [useHint, setUseHint] = useState(false);
  const [currentHint, setCurrentHint] = useState('');
  const [secondHint, setSecondHint] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [maskedWord, setMaskedWord] = useState('');
  const [entryFee, setEntryFee] = useState('0');
  const [pvpRedisMatchId, setPvpRedisMatchId] = useState('');
  const [currentMatchId, setCurrentMatchId] = useState(0);
  const [isPlayer1, setIsPlayer1] = useState(false);
  const [waitingForPvP, setWaitingForPvP] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const [pvpPolling, setPvpPolling] = useState(false);
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
    player2: ''
  });

  async function connectWallet(walletType) {
    try {
      let ethProvider = window.ethereum;
      if (!ethProvider) {
        throw new Error('MetaMask not detected');
      }
      await ethProvider.request({ method: 'eth_requestAccounts' });
      const _provider = new ethers.BrowserProvider(ethProvider);
      const _signer = await _provider.getSigner();
      console.log('Loaded ABI:', contractABI);
      const _contract = new ethers.Contract(contractAddress, contractABI, _signer);
      console.log('Contract functions:', Object.keys(_contract.functions));
      const address = await _signer.getAddress();

      const code = await _provider.getCode(contractAddress);
      if (code === '0x') {
        alert('No contract deployed at ' + contractAddress);
        return;
      }

      const modeIndex = modeEnum[gameMode];
      const config = await _contract.modeConfigs(modeIndex);
      const fee = ethers.formatEther(config.entryFee);

      setProvider(_provider);
      setSigner(_signer);
      setContract(_contract);
      setAccount(address);
      setEntryFee(fee);
      setIsConnected(true);
      setShowWalletModal(false);
    } catch (err) {
      console.error('Erro ao conectar carteira:', err);
      alert('Erro ao conectar: ' + err.message);
    }
  }

  async function checkActiveMatch() {
    try {
      console.log('Checking active matches');
      const openMatchId = await contract.openPvPMatchId(account);
      if (openMatchId > 0) {
        const match = await contract.pvpMatches(openMatchId);
        if (match.active) {
          console.log('Found open match:', openMatchId);
          alert(
            language === 'pt'
              ? 'Você já tem uma partida PvP ativa. Cancele ou finalize a partida atual.'
              : 'You already have an active PvP match. Cancel or finish the current match.'
          );
          setCurrentMatchId(Number(openMatchId));
          setPvpRedisMatchId(`pvp:${openMatchId}`);
          setWaitingForPvP(match.player2 === ethers.ZeroAddress);
          setIsPlayer1(match.player1.toLowerCase() === account.toLowerCase());
          setPvpPolling(true);
          setMatchState(prev => ({ ...prev, player2: match.player2 }));
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
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.matchId) {
        const match = await contract.pvpMatches(data.matchId);
        if (match.active && match.player2 === ethers.ZeroAddress) {
          return Number(data.matchId);
        }
      }
      return 0;
    } catch (err) {
      console.error('Error finding open match:', err);
      return 0;
    }
  }

  async function handlePvPStart() {
    console.log('Starting handlePvPStart', { account, contract: !!contract });
    if (!contract || !account) {
      console.log('Missing contract or account');
      alert(language === 'pt' ? 'Conecte a carteira primeiro!' : 'Connect wallet first!');
      return;
    }

    try {
      console.log('Checking for active match');
      const hasActiveMatch = await checkActiveMatch();
      if (hasActiveMatch) return;

      console.log('Checking for open matches');
      const openMatchId = await findOpenMatch();
      if (openMatchId > 0) {
        console.log('Joining match:', openMatchId);
        const config = await contract.modeConfigs(modeEnum.pvp);
        const feeInWei = config.entryFee;
        const tx = await contract.joinPvPMatch(openMatchId, { value: feeInWei });
        console.log('Join transaction sent:', tx.hash);
        await tx.wait();
        console.log('Join transaction confirmed');

        const res = await fetch(`${BACKEND_URL}/pvp/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: account, lang: language, contractMatchId: openMatchId })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setPvpRedisMatchId(data.matchId);
        setCurrentMatchId(openMatchId);
        setIsPlayer1(false);
        setWaitingForPvP(false);
        setPvpPolling(true);
        setGameActive(true);
      } else {
        console.log('Creating new PvP match');
        if (!contract.createPvPMatch) {
          throw new Error('createPvPMatch function not found. Check ABI.');
        }
        const tx = await contract.createPvPMatch();
        console.log('Create transaction sent:', tx.hash);
        await tx.wait();
        console.log('Create transaction confirmed');

        const newId = await contract.pvpMatchCounter();
        const contractMatchId = Number(newId);
        console.log('New match ID:', contractMatchId);

        const res = await fetch(`${BACKEND_URL}/pvp/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: account, lang: language, contractMatchId })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setPvpRedisMatchId(data.matchId);
        setCurrentMatchId(contractMatchId);
        setIsPlayer1(true);
        setWaitingForPvP(true);
        setPvpPolling(true);
      }
    } catch (err) {
      console.error('PvP Error:', err);
      if (err.reason) {
        alert(`Erro no contrato: ${err.reason}`);
      } else if (err.data) {
        alert(`Contrato rejeitou com dados: ${err.data}`);
      } else {
        alert(`Erro ao iniciar PvP: ${err.message}`);
      }
    }
  }

  async function handleCancelPvP() {
    try {
      if (!contract || !currentMatchId) {
        throw new Error('No active match to cancel');
      }
      const tx = await contract.cancelPvPMatch(currentMatchId);
      console.log('Cancel transaction sent:', tx.hash);
      await tx.wait();
      console.log('Cancel transaction confirmed');

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
        player2: ''
      });
    } catch (err) {
      console.error('Cancel PvP Error:', err);
      alert(`Erro ao cancelar PvP: ${err.message}`);
    }
  }

  async function handleConfirmPvP() {
    try {
      if (!contract || !currentMatchId) {
        throw new Error('No match to confirm');
      }
      const config = await contract.modeConfigs(modeEnum.pvp);
      const feeInWei = config.entryFee;
      const tx = await contract.confirmPvPMatch(currentMatchId, { value: feeInWei });
      console.log('Confirm transaction sent:', tx.hash);
      await tx.wait();
      console.log('Confirm transaction confirmed');

      setGameActive(true);
    } catch (err) {
      console.error('Confirm PvP Error:', err);
      alert(`Erro ao confirmar PvP: ${err.message}`);
    }
  }

  async function guessLetter(letter) {
    try {
      if (matchState.currentTurn.toLowerCase() !== account.toLowerCase()) {
        alert(language === 'pt' ? 'Não é sua vez!' : 'Not your turn!');
        return;
      }

      const res = await fetch(`${BACKEND_URL}/pvp/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: pvpRedisMatchId,
          address: account,
          letter
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
    } catch (err) {
      console.error('Guess error:', err);
      alert(`Erro ao chutar letra: ${err.message}`);
    }
  }

  async function testPvpMatches(id) {
    try {
      const match = await contract.pvpMatches(id);
      console.log('pvpMatches result:', match);
    } catch (err) {
      console.error('pvpMatches error:', err);
    }
  }

  useEffect(() => {
    let interval;
    if (pvpPolling && pvpRedisMatchId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/pvp/state/${pvpRedisMatchId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);

          setMatchState({
            word: data.word,
            currentTurn: data.currentTurn,
            player1Chances: data.player1Chances,
            player2Chances: data.player2Chances,
            guesses: data.guesses,
            firstPlayer: data.firstPlayer,
            countdown: data.countdown,
            turnTimer: data.turnTimer,
            winner: data.winner,
            player2: data.player2 || matchState.player2
          });

          if (data.winner) {
            setPvpPolling(false);
            setGameActive(false);
          } else if (data.countdown === 0 && data.currentTurn) {
            setGameActive(true);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [pvpPolling, pvpRedisMatchId]);

  useEffect(() => {
    let interval;
    if (waitingForPvP) {
      interval = setInterval(() => {
        setWaitingSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [waitingForPvP]);

  // Placeholder functions (replace with your implementations)
  const startGame = () => console.log('Start non-PvP game');
  const forceEndGame = () => console.log('Force end game');
  const renderChances = () => <div>Chances placeholder</div>;
  const renderTimer = () => <div>Timer placeholder</div>;
  const renderLetters = () => <div>Letters placeholder</div>;
  const renderMessage = () => '';
  const renderLeaderboard = () => <div>Leaderboard placeholder</div>;

  return (
    <>
      <div style={{ position: 'absolute', top: '10px', right: '20px', textAlign: 'right' }}>
        {!isConnected ? (
          <div>
            <p>{language === 'pt' ? 'Conectar carteira:' : 'Connect wallet:'}</p>
            <button className="action-button" onClick={() => setShowWalletModal(true)}>
              {language === 'pt' ? 'Conectar Carteira' : 'Connect Wallet'}
            </button>
          </div>
        ) : (
          <>
            <p>👤 {account.slice(0, 6)}...{account.slice(-4)}</p>
            <button
              className="action-button"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
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
            <button className="action-button" onClick={() => setLanguage('pt')}>
              Português
            </button>
            <button className="action-button" onClick={() => setLanguage('en')}>
              English
            </button>
          </div>
          <div style={{ marginTop: '10px' }}>
            <label>
              <input
                type="radio"
                name="gameMode"
                value="normal"
                checked={gameMode === 'normal'}
                onChange={() => setGameMode('normal')}
                disabled={gameActive || waitingForPvP}
              />
              {language === 'pt' ? ' Modo Normal' : ' Normal Mode'}
            </label>
            <label style={{ marginLeft: '15px' }}>
              <input
                type="radio"
                name="gameMode"
                value="hardcore"
                checked={gameMode === 'hardcore'}
                onChange={() => setGameMode('hardcore')}
                disabled={gameActive || waitingForPvP}
              />
              {language === 'pt' ? ' Modo Hardcore' : ' Hardcore Mode'}
            </label>
            <label style={{ marginLeft: '15px' }}>
              <input
                type="radio"
                name="gameMode"
                value="pvp"
                checked={gameMode === 'pvp'}
                onChange={() => setGameMode('pvp')}
                disabled={gameActive || waitingForPvP}
              />
              {language === 'pt' ? ' Modo PvP' : ' PvP Mode'}
            </label>
          </div>

          {account && (
            <>
              {gameMode !== 'pvp' && (
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
                    <img src="/forca.png" alt="Forca" style={{ width: '130px', marginRight: '20px' }} />
                    <img src="/forca.png" alt="Forca" style={{ width: '130px', marginLeft: '20px' }} />
                  </div>

                  <button className="action-button" onClick={startGame}>
                    {translations[language].start}
                  </button>
                </>
              )}

              {gameMode === 'pvp' && (
                <>
                  {!gameActive && !waitingForPvP && !currentMatchId && (
                    <button className="action-button" onClick={handlePvPStart}>
                      {language === 'pt' ? 'Iniciar PvP' : 'Start PvP'}
                    </button>
                  )}

                  {waitingForPvP && (
                    <div style={{ marginTop: '10px' }}>
                      <p>
                        ⏳{' '}
                        {language === 'pt'
                          ? `Aguardando adversário... (${waitingSeconds}s)`
                          : `Waiting for opponent... (${waitingSeconds}s)`}
                      </p>
                      <button className="action-button" onClick={handleCancelPvP}>
                        {language === 'pt' ? 'Cancelar Partida' : 'Cancel Match'}
                      </button>
                    </div>
                  )}

                  {isPlayer1 && currentMatchId && !waitingForPvP && !gameActive && matchState.player2 && (
                    <button className="action-button" onClick={handleConfirmPvP}>
                      {language === 'pt' ? 'Confirmar e Pagar' : 'Confirm and Pay'}
                    </button>
                  )}

                  {(gameActive || matchState.countdown > 0) && (
                    <div style={{ marginTop: '10px' }}>
                      {matchState.countdown > 0 ? (
                        <p>
                          {language === 'pt'
                            ? `Iniciando em ${matchState.countdown} segundos`
                            : `Starting in ${matchState.countdown} seconds`}
                        </p>
                      ) : (
                        <>
                          <p className="masked-word">{matchState.word || maskedWord}</p>
                          <p style={{ fontWeight: 'bold', color: matchState.currentTurn.toLowerCase() === account.toLowerCase() ? 'lime' : 'orange' }}>
                            {matchState.currentTurn.toLowerCase() === account.toLowerCase()
                              ? (language === 'pt' ? 'É sua vez!' : 'Your turn!')
                              : (language === 'pt' ? 'Aguardando oponente...' : 'Waiting opponent...')}
                          </p>
                          <p>
                            {language === 'pt' ? 'Suas chances:' : 'Your chances:'}{' '}
                            {isPlayer1 ? matchState.player1Chances : matchState.player2Chances}
                          </p>
                          <p>
                            {language === 'pt' ? 'Chances do adversário:' : 'Opponent chances:'}{' '}
                            {isPlayer1 ? matchState.player2Chances : matchState.player1Chances}
                          </p>
                          <p>
                            {language === 'pt' ? 'Tempo do turno:' : 'Turn timer:'} {matchState.turnTimer} segundos
                          </p>
                          {matchState.currentTurn.toLowerCase() === account.toLowerCase() && (
                            <div style={{ marginTop: '10px' }}>
                              <input
                                type="text"
                                maxLength="1"
                                onChange={(e) => {
                                  if (e.target.value) guessLetter(e.target.value.toUpperCase());
                                }}
                                placeholder={language === 'pt' ? 'Chute uma letra' : 'Guess a letter'}
                                style={{ width: '50px', textAlign: 'center' }}
                              />
                            </div>
                          )}
                          {matchState.winner && (
                            <p style={{ fontWeight: 'bold', color: 'gold' }}>
                              {language === 'pt' ? 'Vencedor: ' : 'Winner: '}
                              {matchState.winner.toLowerCase() === account.toLowerCase() ? 'Você' : 'Adversário'}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  <button className="action-button" onClick={() => testPvpMatches(1)}>
                    Test pvpMatches(1)
                  </button>
                </>
              )}

              {gameActive && useHint && gameMode !== 'pvp' && (
                <div className="hint">
                  {gameMode === 'hardcore' ? (
                    <>
                      <p>
                        <strong>{language === 'pt' ? 'Dica 1:' : 'Hint 1:'}</strong> {currentHint}
                      </p>
                      {timeLeft <= 30 && secondHint && (
                        <p>
                          <strong>{language === 'pt' ? 'Dica 2:' : 'Hint 2:'}</strong> {secondHint}
                        </p>
                      )}
                    </>
                  ) : (
                    <p>
                      <strong>{language === 'pt' ? 'Dica:' : 'Hint:'}</strong> {currentHint}
                    </p>
                  )}
                </div>
              )}

              {gameActive && !useHint && gameMode !== 'pvp' && (
                <p>{language === 'pt' ? 'Sem dica selecionada' : 'No hint selected'}</p>
              )}

              {gameActive && (
                <div style={{ marginTop: '10px' }}>
                  <button className="action-button" onClick={() => forceEndGame(false)}>
                    {language === 'pt' ? 'Forçar Derrota' : 'Force Loss'}
                  </button>
                </div>
              )}
            </>
          )}

          {gameMode !== 'pvp' && <p className="masked-word">{maskedWord}</p>}

          {gameMode !== 'pvp' && renderChances()}
          {gameMode !== 'pvp' && renderTimer()}
          {gameMode !== 'pvp' && <div style={{ margin: '10px' }}>{renderLetters()}</div>}
          <p className="message">{renderMessage()}</p>
        </div>

        <div className="leaderboard-section">{renderLeaderboard()}</div>
      </div>
    </>
  );
}

export default App;