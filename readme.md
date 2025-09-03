# Monopoly Cash Exchange

A minimal Monopoly-style cash exchange system.  
Focus: manage player balances and transfer money between players with real-time UI updates via PocketBase.

No board logic, property ownership, chance/community cards, or game rules—only balance tracking and transfers.

## Tech Stack
- Backend: Node.js + Express ([server.js](server.js))
- Realtime / DB: PocketBase (self-hosted)
- Frontend: Vanilla HTML/CSS/JS ([public/game.html](public/game.html))
- Transport: REST + PocketBase realtime subscription

## Features
- Add players (auto-initialized Banker with large balance)
- List players
- Get individual balance
- Transfer money between two players with validation
- Local transaction history (per player, stored in localStorage)
- Automatic balance updates (PocketBase realtime)
- Basic optimistic UX + polling fallback

## Data Model (PocketBase)
Collection: players  
Fields:
- name (text, required, UNIQUE)
- money (number, required, default e.g. 2500)
PocketBase auto fields: id, created, updated, etc.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Run PocketBase
Download from https://pocketbase.io/docs/  
Place the binary (e.g. pocketbase) in a backend folder and run:
```bash
./pocketbase serve
```
PocketBase default admin UI: http://127.0.0.1:8090/_/

Create the players collection as described above. (Or let the server fail until you create it.)

### 3. Run the server
```bash
node server.js
```
App served at: http://localhost:3000

### 4. Open a player session
Navigate to:
```
http://localhost:3000/<playerName>/game
```
(If the player does not exist yet, POST to /add-player first.)

## API

Base URL: http://localhost:3000

### POST /add-player
Body:
```json
{ "name": "Alice" }
```
Response: `{ "message": "Player added successfully" }`

### POST /get-balance
Body:
```json
{ "name": "Alice" }
```
Response:
```json
{ "name": "Alice", "balance": 2500 }
```

### GET /get-players
Response:
```json
{ "players": ["Banker","Alice","Bob"] }
```

### POST /submit-transaction
Body:
```json
{ "source": "Alice", "target": "Bob", "amount": 300 }
```
Validations:
- Players must exist
- Amount > 0
- Source must have sufficient funds

Response:
```json
{
  "message": "Transaction successful",
  "updatedSource": { "...": "..." },
  "updatedTarget": { "...": "..." }
}
```

### Sample curl
```bash
curl -X POST http://localhost:3000/submit-transaction \
  -H "Content-Type: application/json" \
  -d '{"source":"Alice","target":"Bob","amount":500}'
```

## Realtime Updates
Implemented in [public/game.html](public/game.html) using:
```js
pbClient.collection('players').subscribe('*', (e) => { ... });
```
On player record update, the UI updates balances without a full reload.  
Fallback polling every 3s remains for resilience.

## Folder Structure
```
.
├─ server.js              # Express server & endpoints
├─ public/
│  ├─ index.html          # (Entry page if added)
│  └─ game.html           # Player UI
└─ package.json
```

## Security / Integrity Notes
- No auth layer (anyone can call endpoints) — for local / controlled use only.
- No transaction rollback (two sequential updates in PocketBase).
- Race conditions possible under heavy concurrent transfers (could improve with server-side locking or version checks).

## Possible Improvements
- Add authentication / session tokens
- Server-side transaction log + rollback
- Atomic transfer abstraction (wrap in one operation if backend allows)
- Administrative dashboard (Banker view)
- Rate limiting & input sanitization hardening
- Unit + integration tests
- Player removal / rename endpoints

## Development Tips
- If realtime stops (network hiccup), the polling still refreshes balances.
- To reset everything: clear the players collection in PocketBase, restart server (Banker re-created).

## License
MIT (adjust as desired)

---
Minimal, focused, and extendable. Add only what the monopoly session needs.