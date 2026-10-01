# DUEL-ARENA🎮

Hey everyone! Welcome to **DUEL-ARENA**. 

This is a project I built to solve a problem statement that asked for a browser-based multiplayer game. Instead of just building one game and calling it a day, I decided to build a whole mini-arena where you can play three classic games:
- ❌⭕ **Tic-Tac-Toe**
- 🔴🟡 **Connect Four**
- ✂️🪨 **Rock Paper Scissors**

You can play it live right now! 👉 **[Play DUEL-ARENA Here](https://srivris1.github.io/VALTREAK/)**

## The Tech Stack
I wanted this to be fast and modern, so here is what I used to build it:
- **React & TypeScript**: For building the UI and keeping the game logic strictly typed and bug-free.
- **Vite**: Because waiting for Webpack to bundle things is boring. Vite makes local development insanely fast.
- **Tailwind CSS**: For all the styling. I also implemented a custom dark/light mode toggle. 
- **Framer Motion**: To add those buttery smooth micro-animations when you make a move or win a round.
- **PeerJS (WebRTC)**: This is the secret sauce for the multiplayer aspect. I'll explain more about this below!

## How the Multiplayer Actually Works

When I was thinking about how to make this multiplayer, I really didn't want to spin up and maintain a dedicated WebSocket backend server just for this. So, I went with **PeerJS**, which is a wrapper around WebRTC.

Here is how everything connects under the hood:
1. **Hosting**: When player 1 clicks "Host a live room", the app uses PeerJS to connect to a free public signaling server and gets assigned a unique ID. I map this long ID to a simple 5-letter room code to make it easy to share.
2. **Joining**: Player 2 types in that 5-letter code. The app figures out the original PeerJS ID and asks the signaling server to connect them directly to Player 1.
3. **Peer-to-Peer**: Once they are connected, the signaling server steps out of the way. All the game data (like who clicked which button, chat messages, restarting rounds) is sent directly between the two browsers using WebRTC data channels. It's super fast and has virtually zero lag.

All the game logic and state synchronization is handled via custom React reducers. Whenever you make a move, your local state updates, and it fires off a JSON payload across the PeerJS connection so the other player's screen updates instantly.

## Running it locally

If you want to pull this down and run it on your own machine, it's super simple. 

First, clone the repo:
```bash
git clone https://github.com/srivris1/VALTREAK.git
cd VALTREAK
```

Install the dependencies:
```bash
npm install
```

And start the dev server:
```bash
npm run dev
```
Then just open `http://localhost:5180` in your browser and you're good to go. You can open two different tabs to test out the multiplayer locally.
