# Secure Biometric Authentication System

**Project developed for:** COMP.SEC.300-2025-2026-1 Secure Programming  
Tampere University (Tampereen yliopisto)

---

A proof-of-concept web application implementing secure, privacy-first biometric authentication using facial descriptors, AES-256 encryption, and PBKDF2 key stretching.

## Getting Started

### 1. Prerequisites
- Node.js
- Webcam

### 2. Installation
```bash
npm install
```
### 3. Environment Setup
Create a .env file in the root directory and add the following variables.

**CRITICAL:** The ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes) to satisfy AES-256 requirements.

```
PORT=3000
# Generate a 64-character hex string for the key
ENCRYPTION_KEY=64_HEX_CHARACTERS_GO_HERE_EXAMPLE_8f3a...
# A unique string for PBKDF2 salting
ENCRYPTION_SALT=your_unique_random_salt_string
```

### 4. Models
Ensure the public/models folder contains the required face-api.js weights:

- tiny_face_detector_model-weights_manifest.json
- face_landmark_68_model-weights_manifest.json
- face_recognition_model-weights_manifest.json

### 5. Running the App
```
node server.js
```

## Security Implementation Documentation
This project focuses on the principle of Defense in Depth.

### 1. Biometric Data Minimization
- Instead of uploading raw images (photos) of users, the application uses Client-Side Feature Extraction.
- The browser processes the video stream and converts the face into a 128-float vector (Embedding).
- The raw pixels never leave the user's machine, mitigating the risk of facial image leaks.

### 2. Cryptographic Hardening (AES-256-CBC)
- Biometric descriptors are encrypted at rest.
- **Algorithm:** AES-256 in Cipher Block Chaining (CBC) mode.
- **Uniqueness:** A unique 16-byte Initialization Vector (IV) is generated for every encryption operation, ensuring that even if a user registers twice, the ciphertext is completely different.

### 3. Key Stretching (PBKDF2)
- To prevent brute-force attacks on the master secret, we implement Key Stretching.
- **Function:** PBKDF2 (Password-Based Key Derivation Function 2).
- **Iterations:** 100,000 rounds of SHA-256.
- **Impact:** An attacker must perform a massive computational task for every password guess, slowing down offline attacks significantly.

### 4. Brute-Force & DoS Protection
- The server implements Rate Limiting on all /api/ endpoints using express-rate-limit.
- **Configuration:** 100 requests per 15 minutes per IP address.
- **Purpose:** Protects the server's CPU from intensive cryptographic calculations and prevents automated biometric "guessing."

### 5. Secure Error Handling
- The application utilizes Guard Clauses and generic error messages.
- Prevents "Verbose Error Leakage" (Stack traces or file paths).
- Standardized 401 Unauthorized responses for both "User Not Found" and "Biometric Mismatch" to prevent User Enumeration.

### 6. Biometric Comparison Logic (Euclidean Distance)
Unlike password-based systems that require an exact string match, biometric data has slight variances due to lighting and positioning.
- **The Algorithm:** The system calculates the **Euclidean Distance** between the freshly captured 128-float vector and the decrypted vector stored in the database.
- **Threshold Selection:** A strict threshold of **< 0.6** is implemented. 
- **Security Trade-off:** This value is chosen to balance the *False Acceptance Rate* (FAR) and the *False Rejection Rate* (FRR). A distance significantly below 0.6 indicates a strong biometric match, while anything above is rejected as an unauthorized access attempt.

## Known Vulnerabilities & Limitations

While this system implements "Defense in Depth," it is a proof-of-concept with specific known limitations:

### 1. Lack of Liveness Detection (Spoofing)
The current implementation uses a standard 2D webcam feed. It does not distinguish between a real human face and a high-resolution photo or video played on a tablet (Presentation Attack).
- **Mitigation:** In a production environment, 3D depth sensors or "challenge-response" (asking the user to blink or turn their head) would be required.

### 2. Client-Side Integrity
Since the biometric extraction occurs in the user's browser, a sophisticated attacker could bypass the webcam entirely and "inject" a stolen 128-float vector directly into the API request.
- **Mitigation:** This could be addressed using hardware-backed "Trusted Execution Environments" (TEEs) or signed biometric hardware.

### 3. Database in Memory
For the scope of this project, the `secureUserDatabase` is stored in server-side RAM. If the server restarts, all registered users are lost.
- **Mitigation:** In a final product, this would be replaced with a persistent database like MongoDB or PostgreSQL, while keeping the AES-256 field encryption logic.

### 4. Brute Force of Thresholds
While rate limiting is active, the fuzzy-matching nature of biometrics means an attacker doesn't need an "exact" key, just one that is "close enough" (Distance < 0.6).
- **Mitigation:** Increasing the PBKDF2 iterations or lowering the distance threshold (at the cost of user convenience) helps mitigate this risk.

## GDPR & Privacy
- **Purpose Limitation:** Biometric data is collected solely for authentication.
- **Integrity and Confidentiality:** Ensured through AES-256 encryption.
- **Data Minimization:** No raw images are stored; only non-reversible mathematical embeddings.
