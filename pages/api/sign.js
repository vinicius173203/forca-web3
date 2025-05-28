// pages/api/sign.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://backend-assinatura-production.up.railway.app/sign-result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro no proxy da Vercel:', error);
    res.status(500).json({ error: 'Erro no proxy', details: error.message });
  }
}
