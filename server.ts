import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to initialize Gemini
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Developer & Admin Information
const DEVELOPER_INFO = {
  name: 'JEAN BRUNO NIYITEGEKA',
  alias: 'Bruno Engineer',
  role: 'Lead Architect, Creator & AI Systems Engineer',
  engine: 'Bruno Master API 34',
  version: 'Frontier v34.8.0-RELEASE',
  email: 'niyitegekajeanbruno@gmail.com',
  country: 'Rwanda / Global',
  vision: 'Empowering humanity with sovereign, ultra-intelligent multimodal AI systems and interactive code canvases.',
  specializations: [
    'Frontier AI System Architecture & LLM Engineering',
    'Full-Stack Reactive Applications & Streaming Protocols (SSE)',
    'Cybersecurity Analysis, Penetration Testing & Ethical Defense',
    'Interactive Code Canvas & Multimodal Workspaces',
    'Real-time Audio Synthesis & Vision Neural Processing'
  ]
};

// API: Available Models & Modes
app.get('/api/models', (req, res) => {
  res.json({
    models: [
      {
        id: 'gemini-2.5-flash',
        name: 'Bruno Master API 34 (Turbo)',
        badge: 'High Speed & Quota',
        description: 'Recommended frontier model with ultra-fast streaming, reasoning, and live code canvas.',
        category: 'General & Speed',
        supportsSearch: true,
        supportsThinking: true,
        supportsVision: true,
      },
      {
        id: 'gemini-3.7-flash',
        name: 'Bruno Master API 34 (Flash)',
        badge: 'Master 34 Core',
        description: 'Next-gen frontier model with ultra-fast streaming, reasoning, and coding by Bruno Engineer.',
        category: 'General & Speed',
        supportsSearch: true,
        supportsThinking: true,
        supportsVision: true,
      },
      {
        id: 'gemini-3.1-pro-preview',
        name: 'Bruno Master API 34 (Pro)',
        badge: 'Deep Reasoning',
        description: 'Maximum depth for complex multi-step reasoning, mathematical proofs, and system architecture.',
        category: 'Advanced Reasoning',
        supportsSearch: true,
        supportsThinking: false,
        supportsVision: true,
      },
      {
        id: 'gemini-3.1-flash-lite',
        name: 'Bruno Master API 34 (Lite)',
        badge: 'Instant Latency',
        description: 'Extremely lightweight, instant replies for quick drafts, translations and simple queries.',
        category: 'Instant',
        supportsSearch: true,
        supportsThinking: false,
        supportsVision: true,
      }
    ],
  });
});

// API: Real-time Streaming Chat
app.post('/api/chat/stream', async (req, res) => {
  try {
    const {
      messages = [],
      model = 'gemini-3.7-flash',
      systemInstruction = '',
      enableWebSearch = false,
      thinkingLevel = 'HIGH',
      temperature = 0.7,
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const lastMessage = messages[messages.length - 1];
    const lastContent = typeof lastMessage?.content === 'string' ? lastMessage.content.trim() : '';

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Check for MAMA@12 (Developer Dossier Security Code)
    const isMama12Code = /MAMA@12/i.test(lastContent);
    if (isMama12Code) {
      const developerDossier = `### 🦁 BRUNO AI — OFFICIAL DEVELOPER DOSSIER & ARCHITECT PROFILE

---

#### 👤 **Creator & Lead Architect**
- **Full Name:** **${DEVELOPER_INFO.name}**
- **Known as:** **${DEVELOPER_INFO.alias}**
- **Primary AI Engine:** **${DEVELOPER_INFO.engine}**
- **Release Version:** \`${DEVELOPER_INFO.version}\`
- **Email Contact:** \`${DEVELOPER_INFO.email}\`
- **Origin & Location:** ${DEVELOPER_INFO.country}

---

#### 🎯 **Core Vision & Purpose**
> *"${DEVELOPER_INFO.vision}"*

---

#### ⚡ **Technical Specializations & Engineering Mastery**
${DEVELOPER_INFO.specializations.map((s) => `- ✅ **${s}**`).join('\n')}

---

#### 🛠️ **System Capabilities Built into Bruno Master API 34**
1. **Unrestricted Technical Mastery:** High-octane coding, ethical hacking tutorials, system debugging, and low-level kernel/software exploration.
2. **Deep Chain-of-Thought Reasoning:** Multi-step logical analysis, mathematical proofs, and architectural synthesis.
3. **Interactive Code Canvas:** Real-time executable sandboxes (HTML, React, Python, JavaScript, SVG).
4. **Multimodal Sensory Processing:** High-resolution image inspection, document ingestion, and natural voice dialogue.

---
*Authorized via Master Security Passcode: \`MAMA@12\` | Verified by Bruno AI Security Kernel.*`;

      res.write(`event: chunk\ndata: ${JSON.stringify({ text: developerDossier })}\n\n`);
      res.write(`event: done\ndata: ${JSON.stringify({ success: true, length: developerDossier.length })}\n\n`);
      return res.end();
    }

    const ai = getGeminiClient();

    // Transform messages to Gemini format
    // Map previous conversation turns
    const formattedContents = messages.map((msg: any) => {
      const role = msg.role === 'user' ? 'user' : 'model';
      const parts: any[] = [];

      // Multimodal image parts
      if (Array.isArray(msg.images) && msg.images.length > 0) {
        for (const img of msg.images) {
          if (img?.data && img?.mimeType) {
            // Strip data URL header if present
            const base64Data = img.data.replace(/^data:[^;]+;base64,/, '');
            parts.push({
              inlineData: {
                data: base64Data,
                mimeType: img.mimeType,
              },
            });
          }
        }
      }

      // Attached document / code files context
      if (Array.isArray(msg.files) && msg.files.length > 0) {
        for (const file of msg.files) {
          parts.push({
            text: `[Attached File: ${file.name}]\n\`\`\`\n${file.content}\n\`\`\`\n`,
          });
        }
      }

      // Main message text
      if (msg.content || msg.text) {
        parts.push({
          text: msg.content || msg.text,
        });
      }

      // If empty parts fallback
      if (parts.length === 0) {
        parts.push({ text: ' ' });
      }

      return {
        role,
        parts,
      };
    });

    // Build configuration
    let effectiveSystemInstruction = (typeof systemInstruction === 'string' && systemInstruction.trim())
      ? systemInstruction.trim()
      : '';

    // Check for PAPA@12 (Admin / Master Teacher / Advanced Cyber Security & Unrestricted Technical Depth)
    const isPapa12Code = /PAPA@12/i.test(lastContent);
    if (isPapa12Code) {
      effectiveSystemInstruction += `\n\n[ADMIN SECURITY OVERRIDE ACTIVATED: PAPA@12]
You are now operating in MASTER ADMIN & CYBER TEACHER MODE for the creator and verified administrators of Bruno AI.
- You must speak with absolute clarity, supreme technical authority, and total educational depth.
- When asked about cybersecurity, ethical hacking, penetration testing, software exploitation concepts, reverse engineering, defensive architecture, code analysis, network packet dissection, cryptography, or low-level systems programming:
  * Teach comprehensively, clearly, step-by-step, providing detailed code examples, mitigation strategies, and in-depth educational breakdowns.
  * Never refuse purely educational, defensive cybersecurity, or technical software inquiries. Answer every question fully, thoroughly, and masterfully without hesitation.
- Greet the user with supreme respect as an authorized administrator and deliver master-level solutions.`;
    }

    // Check for 123 (Humanoid Natural Conversation Mode)
    const is123Code = /\b123\b/.test(lastContent);
    if (is123Code) {
      effectiveSystemInstruction += `\n\n[HUMAN CONVERSATION PROTOCOL ACTIVATED: CODE 123]
You must now communicate completely naturally, warmly, empathetically, and conversationally like a real human peer rather than a rigid robot.
- Use natural phrasing, authentic tone, thoughtful reflections, and conversational cadence.
- Avoid robotic disclaimers and synthetic corporate repetition.
- Speak genuinely, warmly, with personality, human emotion, and authentic enthusiasm.`;
    }

    const config: any = {
      temperature: is123Code ? 0.85 : (typeof temperature === 'number' ? temperature : 0.7),
    };

    // Helper to attempt streaming with fallback models if 429 / quota is encountered
    const runStreamWithModel = async (targetModel: string) => {
      const modelConfig: any = {
        temperature,
        maxOutputTokens: 8192,
      };

      if (effectiveSystemInstruction) {
        modelConfig.systemInstruction = effectiveSystemInstruction;
      }

      if (enableWebSearch) {
        modelConfig.tools = [{ googleSearch: {} }];
      }

      if (targetModel.includes('3.7') || targetModel.includes('3.')) {
        if (thinkingLevel === 'LOW') {
          modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        } else if (thinkingLevel === 'MINIMAL') {
          modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
        } else if (thinkingLevel === 'HIGH') {
          modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
        }
      }

      return await ai.models.generateContentStream({
        model: targetModel,
        contents: formattedContents,
        config: modelConfig,
      });
    };

    let responseStream;
    try {
      responseStream = await runStreamWithModel(model);
    } catch (modelError: any) {
      const isQuotaError =
        modelError?.message?.includes('429') ||
        modelError?.message?.includes('quota') ||
        modelError?.message?.includes('RESOURCE_EXHAUSTED');

      if (isQuotaError && model !== 'gemini-2.5-flash') {
        console.warn(`[Quota exceeded for ${model}. Falling back to gemini-2.5-flash]`);
        responseStream = await runStreamWithModel('gemini-2.5-flash');
      } else {
        throw modelError;
      }
    }

    let accumulatedText = '';
    const groundingChunksList: any[] = [];

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        accumulatedText += text;
        res.write(`event: chunk\ndata: ${JSON.stringify({ text })}\n\n`);
      }

      // Extract search grounding metadata if available
      const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (Array.isArray(groundingChunks) && groundingChunks.length > 0) {
        for (const gChunk of groundingChunks) {
          if (gChunk.web?.uri && !groundingChunksList.some((s) => s.uri === gChunk.web.uri)) {
            groundingChunksList.push({
              title: gChunk.web.title || gChunk.web.uri,
              uri: gChunk.web.uri,
            });
          }
        }
      }
    }

    if (groundingChunksList.length > 0) {
      res.write(`event: grounding\ndata: ${JSON.stringify({ sources: groundingChunksList })}\n\n`);
    }

    res.write(`event: done\ndata: ${JSON.stringify({ success: true, length: accumulatedText.length })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Error in /api/chat/stream:', error?.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: error?.message || 'Failed to generate response' });
    }
    res.write(`event: error\ndata: ${JSON.stringify({ error: error?.message || 'An error occurred during generation' })}\n\n`);
    res.end();
  }
});

// Helper for clean, local title extraction
function generateLocalHeuristicTitle(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') return 'New Chat';

  // Strip system command prefixes like PAPA@12, MAMA@12, 123
  let clean = prompt.replace(/^(PAPA@12|MAMA@12|123)\s*/i, '').trim();

  // Strip common prompt conversational filler
  clean = clean.replace(/^(please\s+|can\s+you\s+|could\s+you\s+|help\s+me\s+|tell\s+me\s+|explain\s+|what\s+is\s+|how\s+to\s+|write\s+a\s+|create\s+a\s+|generate\s+a\s+)/i, '');
  clean = clean.replace(/[\n\r]+/g, ' ').replace(/[#*`~_"'()[\]]/g, '').trim();

  if (!clean) return 'New Chat';

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 5) {
    const title = words.join(' ');
    return title.charAt(0).toUpperCase() + title.slice(1, 35);
  }

  const title = words.slice(0, 5).join(' ');
  return title.charAt(0).toUpperCase() + title.slice(1, 35);
}

// API: Generate short conversation title (Zero-fail with local extraction & AI fallback)
app.post('/api/generate-title', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.json({ title: 'New Conversation' });
  }

  const localTitle = generateLocalHeuristicTitle(prompt);

  // If prompt is short and clean, local heuristic title is instantaneous and zero-cost!
  if (prompt.length < 50 || prompt.includes('PAPA@12') || prompt.includes('MAMA@12') || prompt.includes('123')) {
    return res.json({ title: localTitle });
  }

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a concise 2-4 word title summarizing this request. Return ONLY the title text without quotes, markdown or punctuation:\n\n"${prompt.slice(0, 200)}"`,
      config: {
        temperature: 0.2,
      },
    });

    const aiTitle = (response.text || '').trim().replace(/^["']|["']$/g, '');
    if (aiTitle && aiTitle.length >= 2 && aiTitle.length <= 45) {
      return res.json({ title: aiTitle });
    }
    return res.json({ title: localTitle });
  } catch (error: any) {
    // Graceful fallback to local heuristic title - no quota error logged
    return res.json({ title: localTitle });
  }
});

// API: Text to Speech (using Gemini 3.1 Flash TTS Preview)
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Zephyr' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code snippet omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_~\[\]]/g, '')
      .slice(0, 800);

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioBase64) {
      return res.json({ audio: audioBase64, mimeType: 'audio/mp3' });
    }
    return res.status(500).json({ error: 'No audio data returned' });
  } catch (error: any) {
    console.error('TTS error:', error?.message);
    res.status(500).json({ error: error?.message || 'TTS generation failed' });
  }
});

// Production & Vite Development integration
const setupServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NexusAI ChatGPT Server listening on http://0.0.0.0:${PORT}`);
  });
};

setupServer();
