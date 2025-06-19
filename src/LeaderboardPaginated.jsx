// LeaderboardPaginated.jsx
import React, { useEffect, useState, useContext } from 'react';
import { GlobalContext } from './Global.jsx';

const LeaderboardPaginated = () => {
  const { currentNetwork, fetchLeaderboardPaginated } = useContext(GlobalContext);
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  useEffect(() => {
    const load = async () => {
      const { data, total } = await fetchLeaderboardPaginated(currentNetwork, page);
      setEntries(data);
      setTotal(total);
    };
    load();
  }, [page, currentNetwork]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="leaderboard-container">
      <h3>🏆 Top Jogadores - {currentNetwork.toUpperCase()}</h3>
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Posição</th>
            <th>Carteira</th>
            <th>Pontos</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={`${e.wallet}-${e.network}`}>

              <td>
                {(() => {
                  const pos = (page - 1) * perPage + i + 1;
                  if (pos === 1) return '🥇';
                  if (pos === 2) return '🥈';
                  if (pos === 3) return '🥉';
                  if (pos === 4 || pos === 5) return '🏅';
                  return pos;
                })()}
              </td>

              <td>{e.wallet.slice(0, 6)}...{e.wallet.slice(-4)}</td>
              <td>{e.playpoints}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '10px' }}>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            style={{
              margin: '2px',
              padding: '5px 10px',
              borderRadius: '8px',
              border: '1px solid #00f7ff',
              background: i + 1 === page ? '#00f7ff' : 'transparent',
              color: i + 1 === page ? '#1a1d3e' : '#00f7ff',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardPaginated;
