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
              ? 'Bem-vindo ao Forca Web3, um jogo de forca on-chain na Monad Testnet! Adivinhe palavras letra por letra e ganhe recompensas em MON enquanto compete no leaderboard global. Escolha entre os modos Fácil, Normal, Hardcore ou PvP, e teste suas habilidades com segurança garantida por contratos inteligentes.'
              : 'Welcome to Forca Web3, an on-chain hangman game on the Monad Testnet! Guess words letter by letter and earn MON rewards while competing on the global leaderboard. Choose between Easy, Normal, Hardcore, or PvP modes, and test your skills with security ensured by smart contracts.'}
          </p>
        </div>

        <div className="section">
          <h3>{translations[language].pt ? 'Passo a Passo' : 'Step by Step'}</h3>
          <ul>
            <li>
              {translations[language].pt
                ? 'Conecte sua carteira (como MetaMask ou OKX) pra começar na Monad Testnet. Você vai precisar de MON pra pagar as taxas de entrada de cada modo.'
                : 'Connect your wallet (like MetaMask or OKX) to start on the Monad Testnet. You’ll need MON to pay the entry fees for each mode.'}
            </li>
            <li>
              {translations[language].pt
                ? 'Escolha o idioma (Português ou Inglês) pra receber palavras e instruções no seu idioma preferido.'
                : 'Choose the language (Portuguese or English) to receive words and instructions in your preferred language.'}
            </li>
            <li>
              {translations[language].pt
                ? 'Selecione o modo de jogo: Fácil, Normal, Hardcore ou PvP. Cada modo tem suas próprias taxas, recompensas em MON e pontos!'
                : 'Select the game mode: Easy, Normal, Hardcore, or PvP. Each mode has its own fees, MON rewards, and points!'}
            </li>
            <li>
              {translations[language].pt
                ? 'Clique ou digite letras pra adivinhar a palavra secreta. No PvP, enfrente outro jogador em tempo real e mostre quem é o melhor!'
                : 'Click or type letters to guess the secret word. In PvP, face another player in real-time and show who’s the best!'}
            </li>
            <li>
              {translations[language].pt
                ? 'Complete a palavra pra ganhar pontos e MON. No PvP, o vencedor leva uma recompensa maior! Seus pontos são registrados no leaderboard on-chain.'
                : 'Complete the word to earn points and MON. In PvP, the winner takes a bigger reward! Your points are recorded on the on-chain leaderboard.'}
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
                  ? 'Perfeito pra iniciantes! As palavras são mais curtas e você tem mais chances pra adivinhar.'
                  : 'Perfect for beginners! Words are shorter, and you have more chances to guess.'}
              </p>
              <ul>
                <li>
                  {translations[language].pt ? 'Taxa de Entrada: 0.05 MON' : 'Entry Fee: 0.05 MON'}
                </li>
                <li>
                  {translations[language].pt
                    ? 'Recompensas: 0.015 MON (base) ou 0.03 MON (vitória perfeita) + 3 pontos'
                    : 'Rewards: 0.015 MON (base) or 0.03 MON (perfect win) + 3 points'}
                </li>
                <li>
                  {translations[language].pt
                    ? 'Por tamanho da palavra: Até 8 letras → 0.005 MON | Até 12 letras → 0.015 MON | Mais de 12 letras → 0.03 MON'
                    : 'By word length: Up to 8 letters → 0.005 MON | Up to 12 letters → 0.015 MON | More than 12 letters → 0.03 MON'}
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
                  {translations[language].pt ? 'Taxa de Entrada: 0.1 MON' : 'Entry Fee: 0.1 MON'}
                </li>
                <li>
                  {translations[language].pt
                    ? 'Recompensas: 0.075 MON (base) ou 0.125 MON (vitória perfeita) + 5 pontos'
                    : 'Rewards: 0.075 MON (base) or 0.125 MON (perfect win) + 5 points'}
                </li>
                <li>
                  {translations[language].pt
                    ? 'Por tamanho da palavra: Até 8 letras → 0.005 MON | Até 12 letras → 0.015 MON | Mais de 12 letras → 0.03 MON'
                    : 'By word length: Up to 8 letters → 0.005 MON | Up to 12 letters → 0.015 MON | More than 12 letters → 0.03 MON'}
                </li>
              </ul>
            </div>

            <div className="mode-item">
              <h4>{translations[language].pt ? 'Modo Hardcore' : 'Hardcore Mode'}</h4>
              <p>
                {translations[language].pt
                  ? 'Pra quem gosta de desafios! Palavras mais difíceis e recompensas incríveis.'
                  : 'For those who love a challenge! Tougher words and amazing rewards.'}
              </p>
              <ul>
                <li>
                  {translations[language].pt ? 'Taxa de Entrada: 0.2 MON' : 'Entry Fee: 0.2 MON'}
                </li>
                <li>
                  {translations[language].pt
                    ? 'Recompensas: 0.24 MON (base) ou 1 MON (vitória perfeita) + 7 pontos'
                    : 'Rewards: 0.24 MON (base) or 1 MON (perfect win) + 7 points'}
                </li>
                <li>
                  {translations[language].pt
                    ? 'Por tamanho da palavra: Até 8 letras → 0.005 MON | Até 12 letras → 0.015 MON | Mais de 12 letras → 0.03 MON'
                    : 'By word length: Up to 8 letters → 0.005 MON | Up to 12 letters → 0.015 MON | More than 12 letters → 0.03 MON'}
                </li>
              </ul>
            </div>

            <div className="mode-item">
              <h4>{translations[language].pt ? 'Modo PvP' : 'PvP Mode'}</h4>
              <p>
                {translations[language].pt
                  ? 'Enfrente outro jogador em tempo real! Mostre quem é o melhor e ganhe uma recompensa maior.'
                  : 'Face another player in real-time! Show who’s the best and win a bigger reward.'}
              </p>
              <ul>
                <li>
                  {translations[language].pt ? 'Taxa de Entrada: 0.5 MON' : 'Entry Fee: 0.5 MON'}
                </li>
                <li>
                  {translations[language].pt
                    ? 'Recompensa: 0.9 MON + 10 pontos pro vencedor!'
                    : 'Reward: 0.9 MON + 10 points for the winner!'}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="section">
          <h3>{translations[language].pt ? 'Segurança e Transparência' : 'Security and Transparency'}</h3>
          <p>
            {translations[language].pt
              ? 'O Forca Web3 foi projetado com segurança em mente, usando um contrato inteligente auditável na Monad Testnet pra proteger seus fundos e garantir um jogo justo. Aqui está como mantemos tudo seguro:'
              : 'Forca Web3 is designed with security in mind, using an auditable smart contract on the Monad Testnet to protect your funds and ensure fair play. Here’s how we keep everything secure:'}
          </p>
          <ul>
            <li>
              <strong>{translations[language].pt ? 'Validação por Assinaturas' : 'Signature Validation'}</strong>
              {translations[language].pt
                ? ': Todas as vitórias e resultados (incluindo partidas PvP) são validados por assinaturas criptográficas (ECDSA) geradas por um backend confiável. Isso impede que alguém manipule os resultados ou roube pontos!'
                : ': All wins and results (including PvP matches) are validated using cryptographic signatures (ECDSA) generated by a trusted backend. This prevents anyone from tampering with results or stealing points!'}
            </li>
            <li>
              <strong>{translations[language].pt ? 'Proteção contra Ataques' : 'Attack Protection'}</strong>
              {translations[language].pt
                ? ': Nosso contrato usa o ReentrancyGuard pra prevenir ataques de reentrância, garantindo que suas transações (como iniciar jogos ou sacar recompensas) sejam seguras.'
                : ': Our contract uses ReentrancyGuard to prevent reentrancy attacks, ensuring that your transactions (like starting games or withdrawing rewards) are safe.'}
            </li>
            <li>
              <strong>{translations[language].pt ? 'Pausabilidade em Emergências' : 'Emergency Pausing'}</strong>
              {translations[language].pt
                ? ': Se algo der errado (ex.: um bug ou ataque), o dono do contrato pode pausar o jogo, protegendo seus fundos até que o problema seja resolvido.'
                : ': If something goes wrong (e.g., a bug or attack), the contract owner can pause the game, protecting your funds until the issue is resolved.'}
            </li>
            <li>
              <strong>{translations[language].pt ? 'Controle de Acesso' : 'Access Control'}</strong>
              {translations[language].pt
                ? ': Apenas o dono do contrato pode alterar configurações importantes (como taxas ou signatários confiáveis), garantindo que ninguém mais possa mexer nas regras do jogo.'
                : ': Only the contract owner can change critical settings (like fees or trusted signers), ensuring no one else can tamper with the game rules.'}
            </li>
            <li>
              <strong>{translations[language].pt ? 'Limites de Jogadas Diárias' : 'Daily Play Limits'}</strong>
              {translations[language].pt
                ? ': Você tem 5 jogadas por dia por modo, pra evitar abusos. Quer mais? Compre um NFT Pass pra ganhar jogadas extras (o processo de compra é seguro e protegido contra reentrância).'
                : ': You get 5 plays per day per mode to prevent abuse. Want more? Buy an NFT Pass for extra plays (the purchase process is secure and protected against reentrancy).'}
            </li>
            <li>
              <strong>{translations[language].pt ? 'Partidas PvP Justas' : 'Fair PvP Matches'}</strong>
              {translations[language].pt
                ? ': No PvP, ambos os jogadores devem pagar a taxa de entrada (0.5 MON), e o contrato verifica que os pagamentos foram feitos antes de resolver a partida. Só o vencedor leva a recompensa (0.9 MON), e tudo é validado por assinaturas.'
                : ': In PvP, both players must pay the entry fee (0.5 MON), and the contract ensures payments are made before resolving the match. Only the winner gets the reward (0.9 MON), and everything is validated with signatures.'}
            </li>
            <li>
              <strong>{translations[language].pt ? 'Gestão Segura de Fundos' : 'Secure Fund Management'}</strong>
              {translations[language].pt
                ? ': O contrato mantém um fundo de liquidez pra recompensas, e todas as transferências (como recompensas ou saques) verificam se há saldo suficiente, evitando falhas.'
                : ': The contract maintains a liquidity pool for rewards, and all transfers (like rewards or withdrawals) check if there’s enough balance, avoiding failures.'}
            </li>
            <li>
              <strong>{translations[language].pt ? 'Transparência Total' : 'Full Transparency'}</strong>
              {translations[language].pt
                ? ': Todas as ações (jogadas, vitórias, partidas PvP, compra de NFTs) emitem eventos na blockchain, permitindo que você rastreie tudo de forma pública e auditável.'
                : ': All actions (plays, wins, PvP matches, NFT purchases) emit events on the blockchain, allowing you to track everything publicly and transparently.'}
            </li>
          </ul>
        </div>

        <div className="section">
          <h3>{translations[language].pt ? 'Dicas pra Mandar Bem' : 'Tips to Do Well'}</h3>
          <p>
            {translations[language].pt
              ? 'Tente vogais primeiro (A, E, I, O, U), já que elas aparecem mais nas palavras.'
              : 'Try vowels first (A, E, I, O, U), as they appear more often in words.'}
          </p>
          <p>
            {translations[language].pt
              ? 'No PvP, seja rápido! Você tem 60 segundos por turno, então planeje suas letras com cuidado pra vencer o oponente.'
              : 'In PvP, be quick! You have 60 seconds per turn, so plan your letters carefully to beat your opponent.'}
          </p>
          <p>
            {translations[language].pt
              ? 'Compre um NFT Pass pra ganhar jogadas extras por dia e aumentar suas chances de subir no leaderboard!'
              : 'Buy an NFT Pass to get extra plays per day and boost your chances of climbing the leaderboard!'}
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