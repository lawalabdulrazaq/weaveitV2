"use strict";
// // src/testVideoGeneration.ts
// import path from 'path';
// import { config } from 'dotenv';
// import { analyzeCode } from './codeAnalyzer';
// import { generateSpeech } from './textToSpeech';
// import { render3DVideo } from './videoGenerator';
// config();
// async function testVideoGeneration() {
//   try {
//     // Sample code to analyze
//     const sampleCode = `
//     function calculateFactorial(n) {
//       if (n === 0 || n === 1) {
//         return 1;
//       }
//       return n * calculateFactorial(n - 1);
//     }
//     // Calculate factorial of 5
//     const result = calculateFactorial(5);
//     console.log(\`The factorial of 5 is \${result}\`);
//     `;
//     console.log('1. Analyzing code...');
//     const analysis = await analyzeCode(sampleCode);
//     console.log('\n--- Generated Tutorial ---\n');
//     console.log(analysis.tutorialText);
//     // Generate speech from tutorial
//     console.log('\n2. Generating speech...');
//     const audioPath = path.join(process.cwd(), 'tester.mp3');
//     await generateSpeech(analysis.tutorialText, audioPath);
//     // Generate video
//     console.log('\n3. Generating video...');
//     const videoPath = await render3DVideo(
//       analysis.tutorialText,
//       audioPath,
//       {
//         theme: 'dark',
//         animationStyle: 'fade',
//         includeCodeHighlight: true,
//         resolution: { width: 1280, height: 720 },
//         quality: 'high'
//       }
//     );
//     console.log(`\nTest completed! Video generated at: ${videoPath}`);
//   } catch (error) {
//     console.error('Error in test:', error);
//   }
// }
// // Run the test
// testVideoGeneration().catch(console.error);
// export default testVideoGeneration;
