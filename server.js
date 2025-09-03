import PocketBase from 'pocketbase';
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';

const pb = new PocketBase('http://127.0.0.1:8090');
const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

async function addBanker() {
    try {
        const existingBanker = await pb.collection('players').getFirstListItem(`name="Banker"`);
        if (existingBanker) {
            console.log('Banker already exists:', existingBanker);
            return;
        }
    } catch (error) {
        if (error.status !== 404) {
            console.error('An error occurred while checking for Banker:', error.message);
            return;
        }
    }

    const data = {
        "name": "Banker",
        "money": 100000,
    };
    try {
        const player_record = await pb.collection('players').create(data);
        console.log('Banker record created:', player_record);
    } catch (error) {
        console.error('An error occurred while creating Banker:', error.message);
    }
}

app.post('/add-player', async (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).send({ error: "Invalid parameters" });
    }
    try {
        const data = {
            "name": name,
            "money": 2500,
        };
        const player_record = await pb.collection('players').create(data);
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
    res.status(200).send({ message: "Player added successfully"});
});

app.post('/get-balance', async (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).send({ error: "Invalid parameters" });
    }
    try {
        const player = await pb.collection('players').getFirstListItem(`name="${name}"`);
        if (!player) {
            return res.status(404).send({ error: "Player not found" });
        }
        res.status(200).send({ name: player.name, balance: player.money });
    } catch (error) {
        console.error('An error occurred:', error.message);
        res.status(500).send({ error: "Internal server error" });
    }
});

app.get('/get-players', async (req, res) => {
    const records = await pb.collection('players').getFullList({
        sort: '-created',
    });
    const player_name = records.map(record => record.name);
    res.status(200).send({ players: player_name });
});

app.post('/submit-transaction', async (req, res) => {
    const { source, target, amount } = req.body;

    if (!source || !target || typeof source !== 'string' || typeof target !== 'string' || source.trim() === '' || target.trim() === '' || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).send({ error: "Invalid parameters" });
    }
    try {
        const sourcePlayer = await pb.collection('players').getFirstListItem(`name="${source}"`);
        const targetPlayer = await pb.collection('players').getFirstListItem(`name="${target}"`);

        if (!sourcePlayer) {
            return res.status(404).send({ error: "Source player not found" });
        }

        if (!targetPlayer) {
            return res.status(404).send({ error: "Target player not found" });
        }

        if (sourcePlayer.money < amount) {
            return res.status(400).send({ error: "Insufficient funds" });
        }

        // Update balances
        const updatedSource = await pb.collection('players').update(sourcePlayer.id, {
            money: sourcePlayer.money - amount,
        });

        const updatedTarget = await pb.collection('players').update(targetPlayer.id, {
            money: targetPlayer.money + amount,
        });

        res.status(200).send({ message: "Transaction successful", updatedSource, updatedTarget });
    } catch (error) {
        console.error('An error occurred:', error.message);
        res.status(500).send({ error: "Internal server error" });
    }
});

// Serve the HTML file
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/:player/game", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "game.html"));
});


await addBanker();

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});