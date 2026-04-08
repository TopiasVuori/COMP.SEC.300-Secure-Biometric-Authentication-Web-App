# COMP.SEC.300-Secure-Biometric-Authentication-Web-App
A school project for course COMP.SEC.300 Secure Programming


Project structure:

secure-face-auth/
├── .env                # Secret keys (ENCRYPTION_KEY, DB_URL)
├── .gitignore          # Tells Git to ignore .env and node_modules
├── package.json        # Project dependencies and npm audit scripts
├── server.js           # Entry point: Express server & API routes
│
├── /middleware         # Security-focused logic
│   └── validate.js     # Input validation (checking the 128-float array)
│
├── /lib                # Core security logic
│   └── crypto.js       # AES-256 encryption/decryption functions
│
├── /public             # Frontend assets served to the browser
│   ├── index.html      # Login/Registration UI
│   ├── /js
│   │   ├── app.js      # Webcam logic & Face-api.js implementation
│   │   └── face-api.min.js # The library itself
│   ├── /models         # Local folder for Face-api.js weights (SSD, Landmarks)
│   │   ├── tiny_face_detector_model-weights_manifest.json
│   │   └── ... (other model files)
│   └── /css
│       └── style.css
│
└── /uploads            # (Optional) Temporary buffer - keep empty for maximum security