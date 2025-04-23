**WeaveIt**

WeaveIt is a powerful TypeScript SDK that transforms code tutorials into engaging video content — complete with slides, audio narration, and optional AI assistance. Designed for developers, educators, and content creators, WeaveIt automates the process of turning technical explanations into dynamic multimedia tutorials.

With built-in support for:
- 📜 Code snippet analysis
- 🧠 AI-powered narration via OpenAI
- 🗣️ Text-to-speech voiceovers
- 🎥 Slide + video generation using `canvas` and `ffmpeg`

You can go from raw `.ts` files to narrated tutorial videos with just one command.

The SDK is fully configurable — users can provide their own OpenAI API keys, toggle mock/test mode, and customize output formats. Whether you're building an AI-driven learning platform or automating dev tutorials, WeaveIt helps you deliver clean, clear, and compelling educational content.

Great! Since *WeaveIt* is an SDK, your README should be clear about how developers can integrate and use it. Here are some important sections you should consider adding if they’re not already there:

---

### 📦 Installation

```bash
npm install weaveit
# or
pnpm add weaveit
```

---

### ⚙️ Configuration

```ts
import { WeaveItConfig } from 'weaveit';

WeaveItConfig.setApiKey('your-api-key-here');
```

---

### 🚀 Usage

```ts
import { generateVideoTutorial } from 'weaveit';

generateVideoTutorial({
  filePath: 'example.ts',
  voice: true,
  video: true
});
```