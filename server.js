require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const app = express();

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const SALT = process.env.ENCRYPTION_SALT || 'default_secret_salt_123';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
    console.error("[CRITICAL] ENCRYPTION_KEY is missing in .env!");
    process.exit(1);
}

// --- MIDDLEWARE ---
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, 
    message: "Too many attempts, please try again later.",
    standardHeaders: true, 
    legacyHeaders: false, 
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/', limiter); // Protect all API routes

// --- SECURITY LOGIC ---

/**
 * Derives a 32-byte key from the .env secret using PBKDF2
 */
function getDerivedKey() {
    console.log("--- PHASE 3: KEY STRETCHING ---");
    console.log("[Action] Running PBKDF2 with 100,000 iterations...");
    return crypto.pbkdf2Sync(ENCRYPTION_KEY, SALT, 100000, 32, 'sha256');
}

function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const key = getDerivedKey();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const key = getDerivedKey();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return JSON.parse(decrypted.toString());
}

// --- DATABASE (MOCK) ---
let secureUserDatabase = [];

// --- API ROUTES ---

app.post('/api/register', (req, res) => {
    const { username, descriptor } = req.body;

    // VALIDATION
    if (!username || !Array.isArray(descriptor) || descriptor.length !== 128) {
        console.warn(`[Security Alert] Invalid registration attempt.`);
        return res.status(400).send("Invalid input data.");
    }

    console.log(`\n--- PHASE 4: SECURE REGISTRATION [${username}] ---`);
    console.log(`[Input] Received biometric vector for: ${username}`);
    
    try {
        const encryptedData = encrypt(JSON.stringify(descriptor));
        secureUserDatabase.push({ username, faceData: encryptedData });
        
        console.log(`[Success] Biometrics encrypted and stored.`);
        console.log(`[Storage] Encrypted Blob: ${encryptedData.substring(0, 30)}...`);
        res.status(200).send("Registered Successfully");
    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).send("Internal Security Error");
    }
});

app.post('/api/login', (req, res) => {
    const { username, descriptor } = req.body;

    // VALIDATION
    if (!username || !Array.isArray(descriptor) || descriptor.length !== 128) {
        return res.status(400).send("Invalid input data.");
    }

    try {
        console.log(`\n--- PHASE 5: SECURE AUTHENTICATION [${username}] ---`);
        
        const user = secureUserDatabase.find(u => u.username === username);
        if (!user) {
            console.warn(`[Audit] Failed Login: User "${username}" not found.`);
            return res.status(401).send("User not found.");
        }

        console.log(`[Action] Fetching encrypted data for ${username}...`);
        const storedDescriptor = decrypt(user.faceData);
        console.log(`[Security] Decryption successful using Derived Key.`);
        
        // Euclidean Distance Calculation
        const distance = Math.sqrt(
            storedDescriptor.reduce((sum, val, i) => sum + Math.pow(val - descriptor[i], 2), 0)
        );

        console.log(`[Math] Euclidean Distance: ${distance.toFixed(4)}`);

        if (distance < 0.6) {
            console.log(`[AUDIT] SUCCESSFUL LOGIN: ${username}`);
            res.status(200).send("Access Granted");
        } else {
            console.warn(`[AUDIT] DENIED: Biometric mismatch for ${username} (Dist: ${distance.toFixed(4)})`);
            res.status(401).send("Biometric mismatch.");
        }
    } catch (error) {
        console.error("[Critical] Auth System Error:", error.message);
        if (!res.headersSent) {
            res.status(500).send("Authentication System Error");
        }
    }
});

app.listen(PORT, () => {
    console.log(`
    =========================================
    SECURE BIOMETRIC SERVER RUNNING
    URL: http://localhost:${PORT}
    MODE: AES-256-CBC with PBKDF2 Salt
    =========================================
    `);
});