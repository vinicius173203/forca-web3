import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { GlobalContext } from './Global.jsx';

const HowToPlay = () => {
  const { language, translations } = useContext(GlobalContext);

  return (
    <div className="how-to-play-container">
      <h1>{translations[language].pt ? 'Como Jogar Forca Web3' : 'How to Play Forca Web3'}</h1>

      <div className="instructions-container">
        <h2>{translations[language].pt ? 'Guia do Jogo' : 'Game Guide'}</h2>

        <div className="section">
          <h3>{translations[language].pt ? 'Introdução' : 'Introduction'}</h3>
          <p>
            {translations[language].pt
              ? 'Bem-vindo ao Forca Web3, um jogo de forca on-chain disponível inicialmente nas Testnets Monad e Somnia! Adivinhe palavras letra por letra e ganhe recompensas enquanto compete no leaderboard global. Escolha entre os modos Fácil, Normal ou Hardcore, e teste suas habilidades com segurança garantida por contratos inteligentes. O modo PvP está em desenvolvimento e será lançado em breve!'
              : 'Welcome to Forca Web3, an on-chain hangman game initially available on the Monad and Somnia Testnets! Guess words letter by letter and earn rewards while competing on the global leaderboard. Choose from Easy, Normal, or Hardcore modes, and test your skills with security guaranteed by smart contracts. The PvP mode is under development and will be released soon!'}
          </p>
        </div>

        <div className="section">
          <h3>{translations[language].pt ? 'Passo a Passo' : 'Step by Step'}</h3>
          <ul>
            <li>
              {translations[language].pt
                ? 'Conecte sua carteira (como MetaMask ou OKX) para começar na Testnet Monad ou Somnia. Você precisará de MON (Monad) ou STT (Somnia) para pagar as taxas de entrada.'
                : 'Connect your wallet (like MetaMask or OKX) to start on the Monad or Somnia Testnet. You’ll need MON (Monad) or STT (Somnia) to pay the entry fees.'}
            </li>
            <li>
              {translations[language].pt
                ? 'Escolha o idioma (Português ou Inglês) para receber palavras e instruções no seu idioma preferido.'
                : 'Choose the language (Portuguese or English) to receive words and instructions in your preferred language.'}
            </li>
            <li>
              {translations[language].pt
                ? 'Selecione o modo de jogo: Fácil, Normal ou Hardcore. Cada modo tem suas próprias taxas, recompensas e pontos!'
                : 'Select the game mode: Easy, Normal, or Hardcore. Each mode has its own fees, rewards, and points!'}
            </li>
            <li>
              {translations[language].pt
                ? 'Clique ou digite letras para adivinhar a palavra secreta. Complete a palavra para ganhar pontos e recompensas.'
                : 'Click or type letters to guess the secret word. Complete the word to earn points and rewards.'}
            </li>
            <li>
              {translations[language].pt
                ? 'Seus pontos são registrados no leaderboard on-chain. Continue jogando para subir no ranking!'
                : 'Your points are recorded on the on-chain leaderboard. Keep playing to climb the ranks!'}
            </li>
          </ul>
        </div>

        <div className="section">
          <h3>{translations[language].pt ? 'Modos de Jogo' : 'Game Modes'}</h3>
          <div className="mode-list">
            <div className="mode-item">
              <h4>{translations[language].pt ? 'Modo Fácil' : 'Easy Mode'}</h4>
              <p>
                {translations[language].pt
                  ? 'Perfeito para iniciantes! As palavras são mais curtas, e você tem mais chances para adivinhar.'
                  : 'Perfect for beginners! Words are shorter, and you have more chances to guess.'}
              </p>
              <ul>
                <li>
                  {translations[language].pt ? 'Taxa de Entrada: 0.1 MON ou 0.005 STT' : 'Entry Fee: 0.1 MON or 0.005 STT'}
                </li>
                <li>
                  {translations[language].pt
                    ? 'Recompensas: 15-20% da taxa de entrada (base) + bônus por tamanho da palavra + 2 pontos'
                    : 'Rewards: 15-20% of entry fee (base) + word length bonus + 2 points'}
                </li>
                <li>
                  {translations[language].pt
                    ? 'Por tamanho da palavra: Até 8 letras → 10% da taxa | Até 12 letras → 15% da taxa | Mais de 12 letras → 20% da taxa'
                    : 'By word length: Up to 8 letters → 10% of fee | Up to 12 letters → 15% of fee | More than 12 letters → 20% of fee'}
                </li>
                <li>
                  {translations[language].pt
                    ? 'Bônus sem dica: +20% na recompensa'
                    : 'No-hint bonus: +20% to reward'}
                </li>
              </ul>
            </div>

            <div className="mode-item">
              <h4>{translations[language].pt ? 'Modo Normal' : 'Normal Mode'}</h4>
              <p>
                {translations[language].pt
                  ? 'Um desafio equilibrado com palavras de tamanho médio e recompensas maiores.'
                  : 'A balanced challenge with medium-length words and bigger rewards.'}
              </p>
              <ul>
                <li>
                  {translations[language].pt ? 'Taxa de Entrada: 0.1 MON ou 0.005 STT' : 'Entry Fee: 0.1 MON or 0.005 STT'}
                </li>
                <li>
                  {translations[language].pt
                    ? 'Recompensas: 50-75% da taxa de entrada (base) + bônus por tamanho da palavra + 5 pontos'
                    : 'Rewards: 50-75% of entry fee (base) + word length bonus + 5 points'}
                </li>
                <li>
                  {translations[language].pt
                    ? 'Por tamanho da palavra: Até 8 letras → 20% da taxa | Até 12 letras → 25% da taxa | Mais de 12 letras → 30% da taxa'
                    : 'By word length: Up to 8 letters → 20% of fee | Up to 12 letters → 25% of fee | More than 12 letters → 30% of fee'}
                </li>
                <li>
                  {translations[language].pt
                    ? 'Bônus sem dica: +20% na recompensa'
                    : 'No-hint bonus: +20% to reward'}
                </li>
              </ul>
            </div>

            <div className="mode-item">
              <h4>{translations[language].pt ? 'Modo Hardcore' : 'Hardcore Mode'}</h4>
              <p>
                {translations[language].pt
                  ? 'Para quem gosta de desafios! Palavras mais difíceis e recompensas incríveis.'
                  : 'For those who love a challenge! Tougher words and amazing rewards.'}
              </p>
              <ul>
                <li>
                  {translations[language].pt ? 'Taxa de Entrada: 0.2 MON ou 0.005 STT' : 'Entry Fee: 0.2 MON or 0.005 STT'}
                </li>
                <li>
                  {translations[language].pt
                    ? 'Recompensas: 100-500% da taxa de entrada (base) + bônus por tamanho da palavra + 7 pontos'
                    : 'Rewards: 100-500% of entry fee (base) + word length bonus + 7 points'}
                </li>
                <li>
                  {translations[language].pt
                    ? 'Por tamanho da palavra: Até 8 letras → 20% da taxa | Até 12 letras → 30% da taxa | Mais de 12 letras → 60% da taxa'
                    : 'By word length: Up to 8 letters → 20% of fee | Up to 12 letters → 30% of fee | More than 12 letters → 60% of fee'}
                </li>
                <li>
                  {translations[language].pt
                    ? 'Bônus sem dica: +20% na recompensa'
                    : 'No-hint bonus: +20% to reward'}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="section">
          <h3>{translations[language].pt ? 'Segurança e Transparência' : 'Security and Transparency'}</h3>
          <p>
            {translations[language].pt
              ? 'O Forca Web3 é um jogo multichain, inicialmente implantado nas Testnets Monad e Somnia, projetado com segurança em mente. Utilizamos um contrato inteligente auditável para proteger seus fundos e garantir um jogo justo. Aqui está como mantemos tudo seguro:'
              : 'Forca Web3 is a multichain game, initially deployed on the Monad and Somnia Testnets, designed with security in mind. We use an auditable smart contract to protect your funds and ensure fair play. Here’s how we keep everything secure:'}
          </p>
          <ul>
            <li>
              <strong>{translations[language].pt ? 'Validação por Assinaturas' : 'Signature Validation'}</strong>
              {translations[language].pt
                ? ': Todas as vitórias e resultados são validados por assinaturas criptográficas (ECDSA) geradas por um backend confiável, garantindo que os resultados não possam ser manipulados.'
                : ': All wins and results are validated using cryptographic signatures (ECDSA) generated by a trusted backend, ensuring results cannot be tampered with.'}
            </li>
            <li>
              <strong>{translations[language].pt ? 'Proteção contra Ataques' : 'Attack Protection'}</strong>
              {translations[language].pt
                ? ': O contrato utiliza ReentrancyGuard para prevenir ataques de reentrância, protegendo transações como iniciar jogos ou sacar recompensas.'
                : ': The contract uses ReentrancyGuard to prevent reentrancy attacks, safeguarding transactions like starting games or withdrawing rewards.'}
            </li>
            <li>
              <strong>{translations[language].pt ? 'Pausabilidade em Emergências' : 'Emergency Pausing'}</strong>
              {translations[language].pt
                ? ': Em caso de problemas (como bugs ou ataques), o dono do contrato pode pausar o jogo, protegendo os fundos dos jogadores até que a situação seja resolvida.'
                : ': In case of issues (like bugs or attacks), the contract owner can pause the game, protecting players’ funds until the issue is resolved.'}
            </li>
            <li>
              <strong>{translations[language].pt ? 'Controle de Acesso' : 'Access Control'}</strong>
              {translations[language].pt
                ? ': Apenas o dono do contrato pode alterar configurações críticas, como taxas, recompensas máximas ou signatários confiáveis, garantindo que as regras do jogo não sejam alteradas indevidamente.'
                : ': Only the contract owner can modify critical settings, such as fees, maximum rewards, or trusted signers, ensuring game rules remain untampered.'}
            </li>
            <li>
              <strong>{translations[language].pt ? 'Gestão Segura de Fundos' : 'Secure Fund Management'}</strong>
              {translations[language].pt
                ? ': O contrato mantém um fundo de liquidez para recompensas, com verificações rigorosas para garantir que as transferências só ocorram se houver saldo suficiente.'
                : ': The contract maintains a liquidity pool for rewards, with strict checks to ensure transfers only occur if sufficient balance is available.'}
            </li>
            <li>
              <strong>{translations[language].pt ? 'Transparência Total' : 'Full Transparency'}</strong>
              {translations[language].pt
                ? ': Todas as ações (jogadas, vitórias, depósitos) emitem eventos na blockchain, permitindo rastreamento público e auditável.'
                : ': All actions (plays, wins, deposits) emit events on the blockchain, enabling public and auditable tracking.'}
            </li>
            <li>
              <strong>{translations[language].pt ? 'Suporte Multichain' : 'Multichain Support'}</strong>
              {translations[language].pt
                ? ': O jogo opera nas Testnets Monad e Somnia, com contratos implantados em ambas as redes para garantir compatibilidade e redundância, aumentando a confiabilidade.'
                : ': The game operates on the Monad and Somnia Testnets, with contracts deployed on both networks to ensure compatibility and redundancy, enhancing reliability.'}
            </li>
          </ul>
        </div>

        <div className="section">
          <h3>{translations[language].pt ? 'Dicas para Mandar Bem' : 'Tips to Do Well'}</h3>
          <p>
            {translations[language].pt
              ? 'Tente vogais primeiro (A, E, I, O, U), já que elas aparecem mais nas palavras.'
              : 'Try vowels first (A, E, I, O, U), as they appear more often in words.'}
          </p>
          <p>
            {translations[language].pt
              ? 'Evite usar dicas para maximizar suas recompensas, ganhando um bônus de 20%!'
              : 'Avoid using hints to maximize your rewards, earning a 20% bonus!'}
          </p>
          <p>
            {translations[language].pt
              ? 'Jogue regularmente para acumular pontos e subir no leaderboard global!'
              : 'Play regularly to accumulate points and climb the global leaderboard!'}
          </p>
        </div>
      </div>

      <Link to="/" className="back-button">
        {translations[language].pt ? 'Voltar' : 'Back'}
      </Link>
    </div>
  );
};

export default HowToPlay;