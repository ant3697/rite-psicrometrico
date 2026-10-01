import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.post('/api/analyze-cycle', async (req, res) => {
  try {
    const { pointsSummary, processesSummary, atmosphere } = req.body;

    const prompt = `Actúa como un Ingeniero Experto en Climatización, Psicrometría y Termodinámica HVAC según el marco conjunto europeo (UNE-EN ISO 7730 y UNE-EN 16798-1 / RITE) y el estándar americano ASHRAE 55.
Analiza la siguiente configuración de ciclo psicrométrico:

Presión atmosférica: ${atmosphere?.pressure ?? 101.3} kPa (Altitud: ${atmosphere?.altitude ?? 0} m)

PUNTOS PSICROMÉTRICOS:
${pointsSummary}

PROCESOS DE TRATAMIENTO DE AIRE:
${processesSummary}

Por favor, proporciona un diagnóstico conciso estructurado en:
1. Evaluación de Confort Térmico: Compara el cumplimiento según el marco europeo conjunto (UNE-EN ISO 7730 con índices PMV/PPD y categorías I, II, III de UNE-EN 16798-1) y según ASHRAE 55.
2. Eficiencia y Diagnóstico de Baterías (evaluación de SHR, riesgo de subenfriamiento innecesario, condensaciones).
3. Oportunidades de Ahorro Energético (Free-cooling/economizador, recuperación entálpica o sensible).
4. Recomendaciones Prácticas de Mejora.
Responde en español con formato Markdown profesional y directo sin rodeos.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Error generating analysis:', error);
    res.status(500).json({ error: error.message || 'Error en el análisis de ciclo' });
  }
});

// Vite middleware in dev or static files in prod
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});
