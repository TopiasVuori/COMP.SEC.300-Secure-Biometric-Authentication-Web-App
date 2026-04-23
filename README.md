# Secure Biometric Authentication System

**Project developed for:** COMP.SEC.300-2025-2026-1 Secure Programming  
Tampere University (Tampereen yliopisto)

---

A proof-of-concept web application implementing secure, privacy-first biometric authentication using facial descriptors, AES-256 encryption, and PBKDF2 key stretching.

## 🚀 Getting Started

### 1. Installation
```bash
npm install
### 2. Environment Setup
Create a .env file in the root directory and add the following variables.

CRITICAL: The ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes) to satisfy AES-256 requirements.

PORT=3000
# Generate a 64-character hex string for the key
ENCRYPTION_KEY=64_HEX_CHARACTERS_GO_HERE_EXAMPLE_8f3a...
# A unique string for PBKDF2 salting
ENCRYPTION_SALT=your_unique_random_salt_string

### 3. Models
Ensure the public/models folder contains the required face-api.js weights:

tiny_face_detector_model-weights_manifest.json

face_landmark_68_model-weights_manifest.json

face_recognition_model-weights_manifest.json

### 4. Running the App
node server.js

🛡️ Security Implementation Documentation
This project focuses on the principle of Defense in Depth.

1. Biometric Data Minimization
Instead of uploading raw images (photos) of users, the application uses Client-Side Feature Extraction.

The browser processes the video stream and converts the face into a 128-float vector (Embedding).

The raw pixels never leave the user's machine, mitigating the risk of facial image leaks.

2. Cryptographic Hardening (AES-256-CBC)
Biometric descriptors are encrypted at rest.

Algorithm: AES-256 in Cipher Block Chaining (CBC) mode.

Uniqueness: A unique 16-byte Initialization Vector (IV) is generated for every encryption operation, ensuring that even if a user registers twice, the ciphertext is completely different.

3. Key Stretching (PBKDF2)
To prevent brute-force attacks on the master secret, we implement Key Stretching.

Function: PBKDF2 (Password-Based Key Derivation Function 2).

Iterations: 100,000 rounds of SHA-256.

Impact: An attacker must perform a massive computational task for every password guess, slowing down offline attacks significantly.

4. Brute-Force & DoS Protection
The server implements Rate Limiting on all /api/ endpoints using express-rate-limit.

Configuration: 100 requests per 15 minutes per IP address.

Purpose: Protects the server's CPU from intensive cryptographic calculations and prevents automated biometric "guessing."

5. Secure Error Handling
The application utilizes Guard Clauses and generic error messages.

Prevents "Verbose Error Leakage" (Stack traces or file paths).

Standardized 401 Unauthorized responses for both "User Not Found" and "Biometric Mismatch" to prevent User Enumeration.

⚖️ GDPR Considerations
This implementation adheres to the principle of Privacy by Design:

Article 32: Security of processing via encryption.

Article 25: Data protection by design and default.