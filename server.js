require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto'); // Built-in Node.js crypto
const app = express();

app.use(express.json()); // To parse JSON face vectors
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 64 hex chars

// --- SECURITY LOGIC: AES-256 Encryption ---
function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// --- SECURITY LOGIC: AES-256 Decryption ---
function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString());
}

// --- API ROUTES ---

// Mock Database (In a real app, use MongoDB or Postgres)
let secureUserDatabase = [];

// --- REGISTER ROUTE ---
app.post('/api/register', (req, res) => {
    try {
        const { username, descriptor } = req.body;

        // SECURITY: Input Validation (SANS 25)
        if (!username || !Array.isArray(descriptor) || descriptor.length !== 128) {
            return res.status(400).send("Invalid biometric data format.");
        }

        // SECURITY: Encrypting the descriptor before storage (OWASP A02)
        const encryptedData = encrypt(JSON.stringify(descriptor));
        
        secureUserDatabase.push({ username, faceData: encryptedData });
        
        console.log(`User ${username} registered with encrypted biometrics.`);
        res.status(200).send("Registration successful and encrypted.");
    } catch (err) {
        res.status(500).send("Internal Server Error");
    }
});

// --- LOGIN ROUTE ---
app.post('/api/login', (req, res) => {
    const { username, descriptor } = req.body;
    
    // Find user in our "database"
    const user = secureUserDatabase.find(u => u.username === username);
    if (!user) return res.status(401).send("User not found.");

    // Decrypt the stored biometric data
    const storedDescriptor = decrypt(user.faceData);

    // Calculate Euclidean Distance (Similarity)
    // Formula: sqrt(sum((a[i] - b[i])^2))
    const distance = Math.sqrt(
        storedDescriptor.reduce((sum, val, i) => sum + Math.pow(val - descriptor[i], 2), 0)
    );

    console.log(`Auth attempt for ${username}. Distance: ${distance.toFixed(4)}`);

    // Security Threshold (0.6 is industry standard for this model)
    if (distance < 0.6) {
        res.status(200).send({ message: "Access Granted", similarity: distance });
    } else {
        res.status(401).send("Access Denied: Biometric mismatch.");
    }
});

app.listen(PORT, () => {
    console.log(`Server running: http://localhost:${PORT}`);
});