### 📌 **Project Overview: AI Agent SDK**

**Goal**: Create a TypeScript SDK that takes a code snippet/script and automates the process of:
1. Explaining the code (Text Tutorial)
2. Converting the explanation to voice (Text-to-Speech)
3. Generating a video that visually simulates the code explanation (Tutorial + Voice Sync)

---

### 🧩 **Key Features**

- `analyzeCode(code: string) → tutorial: string`
- `textToSpeech(text: string) → audioFile: Audio`
- `generateVideo(tutorial: string, audio: Audio) → videoFile: Video`
- CLI and programmatic usage
- Pluggable architecture for models and rendering

---

### 🔧 **Requirements**

#### ✅ APIs & Services
- **OpenAI API**: Code interpretation and explanation (`gpt-4`, `gpt-4-turbo`)
- **ElevenLabs / Google TTS / OpenAI TTS**: Text-to-Speech conversion
- **Remotion / FFmpeg**: Programmatic video generation from script
- **Node.js + TypeScript**: SDK development
- **Canvas / Puppeteer (optional)**: Render code examples visually

#### 📦 Libraries
- `openai`, `axios`, `fs`, `remotion`, `ffmpeg-static`, `fluent-ffmpeg`
- `typescript`, `esbuild`, `dotenv`, `chalk` (for CLI dev)
- `@elevenlabs/tts` (if using ElevenLabs)

---

### 🧠 **Best Route to Build**

1. **Text Tutorial Module**
   - Use OpenAI API (`gpt-4`) to turn code into a natural-language tutorial.
   - Prompt template: "Explain the following code in a step-by-step tutorial."

2. **Voiceover Module**
   - Use TTS API (OpenAI TTS, ElevenLabs) to generate a voiceover of the tutorial.
   - Save output in `.mp3` or `.wav`.

3. **Video Generator Module**
   - Use Remotion or FFmpeg to:
     - Show code visually (slide-style or typing animation).
     - Sync the voiceover with timed slides or highlights.

4. **SDK & CLI Interface**
   - Allow importing modules via `import { generateTutorial } from 'aigen-sdk'`.
   - CLI: `aigen --file script.ts --output tutorial.mp4`

---

### 🏗️ **Architecture Diagram**

```plaintext
                     +-------------------------+
                     |  Your Script Code       |
                     +-----------+-------------+
                                 |
                                 v
                  +-------------+--------------+
                  |     Code Analyzer (GPT)    |
                  |   - Parses and explains    |
                  +-------------+--------------+
                                |
                +---------------+------------------+
                |         Text Tutorial            |
                +---------------+------------------+
                                |
                 +--------------+--------------+
                 |   Text-to-Speech Generator  |
                 | (OpenAI TTS / ElevenLabs)   |
                 +--------------+--------------+
                                |
                 +--------------+--------------+
                 |    Audio + Tutorial Script   |
                 +--------------+--------------+
                                |
                     +----------+---------+
                     |  Video Generator   |
                     |  (Remotion/FFmpeg) |
                     +----------+---------+
                                |
                        +-------+-------+
                        | Final Tutorial |
                        |    Video (mp4) |
                        +---------------+
```

---

### 🔜 **Next Steps**
- Set up TypeScript monorepo (Lerna/Turborepo optional).
- Start with core modules:
  - `codeParser.ts`
  - `ttsEngine.ts`
  - `videoRenderer.ts`
- Define types/interfaces (`TutorialStep`, `VoiceOptions`, etc.)
- Add CLI with `commander.js` or `yargs`.
