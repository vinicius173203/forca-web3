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
              ? 'Você precisa adivinhar a palavra secreta, letra por letra, antes que o tempo acabe ou suas tentativas terminem. No Forca Web3, você pode jogar em diferentes modos e competir no leaderboard on-chain!'
              : 'You need to guess the secret word, letter by letter, before time runs out or your attempts end. In Forca Web3, you can play in different modes and compete on the on-chain leaderboard!'}
          </p>
        </div>

        <div className="section">
          <h3>{translations[language].pt ? 'Passo a Passo' : 'Step by Step'}</h3>
          <ul>
            <li>{translations[language].pt ? 'Conecte sua carteira e prepare-se para desafiar seu cérebro!' : 'Connect your wallet and get ready to challenge your brain!'}</li>
            <li>{translations[language].pt ? 'Escolha o idioma (Português ou Inglês) antes de começar o jogo.' : 'Choose the language (Portuguese or English) before starting the game.'}</li>
            <li>{translations[language].pt ? 'Selecione o modo de jogo: Normal, Hardcore ou PVP.' : 'Select the game mode: Normal, Hardcore, or PVP.'}</li>
            <li>{translations[language].pt ? 'Comece o jogo e clique ou digite letras para tentar adivinhar a palavra secreta. Cada erro reduz suas chances!' : 'Start the game and click or type letters to guess the secret word. Each mistake reduces your chances!'}</li>
            <li>{translations[language].pt ? 'Complete a palavra e ganhe pontos no leaderboard on-chain.' : 'Complete the word and earn points on the on-chain leaderboard.'}</li>
          </ul>
        </div>

        <div className="section">
          <h3>{translations[language].pt ? 'Dicas pra Mandar Bem' : 'Tips to Do Well'}</h3>
          <p>
            {translations[language].pt
              ? 'Os resultados são assinados no backend para garantir que ninguém roube pontos — seus WEB3s de verdade estão seguros!'
              : 'Results are signed in the backend to ensure no one steals points — your real WEB3s are safe!'}
          </p>
          <p>
            {translations[language].pt
              ? 'Tente vogais primeiro (A, E, I, O, U), já que elas aparecem mais nas palavras.'
              : 'Try vowels first (A, E, I, O, U), as they appear more often in words.'}
          </p>
        </div>

        <div className="section">
          <h3>{translations[language].pt ? 'Pontuação e Multiplicadores' : 'Scoring and Multipliers'}</h3>
          <p>{translations[language].pt ? 'Quantos pontos vale cada palavra?' : 'How many points is each word worth?'}</p>
          <ul>
            <li>{translations[language].pt ? 'Até 6 letras → 3 pontos base' : 'Up to 6 letters → 3 base points'}</li>
            <li>{translations[language].pt ? 'Até 9 letras → 4 pontos base' : 'Up to 9 letters → 4 base points'}</li>
            <li>{translations[language].pt ? 'Mais de 9 letras → 5 pontos base' : 'More than 9 letters → 5 base points'}</li>
          </ul>
          <p>{translations[language].pt ? 'Multiplicadores ativos:' : 'Active multipliers:'}</p>
          <ul>
            <li>{translations[language].pt ? 'Sem dica → 2x pontos!' : 'No hint → 2x points!'}</li>
            <li>{translations[language].pt ? 'Resolver rápido (menos de 15s) → +20% bônus!' : 'Solve quickly (under 15s) → +20% bonus!'}</li>
            <li>{translations[language].pt ? 'Palavra longa (mais de 15 letras) → +20% bônus!' : 'Long word (over 15 letters) → +20% bonus!'}</li>
          </ul>
        </div>
      </div>

      <Link to="/" className="back-button">
        {translations[language].pt ? 'Voltar' : 'Back'}
      </Link>
    </div>
  );
};

export default HowToPlay;