import { pickAiMove } from './src/games/ai.ts';
import { createMatch } from './src/games/match.ts';
import { c4ApplyMove } from './src/games/connect4.ts';

try {
  let match = createMatch('connect4');
  console.log("AI thinking Connect Four...");
  const start = Date.now();
  const move = pickAiMove('connect4', match.game, 'p2', 'sharp');
  console.log("AI chose:", move, "in", Date.now() - start, "ms");
} catch (e) {
  console.error("AI crashed:", e);
}
