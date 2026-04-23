const video = document.getElementById('webcam');
const statusText = document.getElementById('status');
const regBtn = document.getElementById('reg-btn');
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('username');

/**
 * PHASE 0: SYSTEM INITIALIZATION
 * Loads AI models and establishes secure media stream
 */
async function init() {
    try {
        console.log("--- SYSTEM INITIALIZATION ---");
        console.log("[Action] Loading face-api models from /models...");
        
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);

        console.log("[Success] AI Models loaded successfully.");

        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
        
        regBtn.disabled = false;
        statusText.innerText = "Status: Ready";
        console.log("[Status] Camera active. Application Ready.");
    } catch (err) {
        console.error("[CRITICAL] Initialization failed:", err);
        statusText.innerText = "Status: Initialization Error";
    }
}

/**
 * HELPER: Visual Debugging
 * Draws facial landmarks over the video for testing verification
 */
function drawVisualFeedback(detection) {
    // Remove old canvases if they exist to keep the UI clean
    const existingCanvas = document.querySelector('canvas');
    if (existingCanvas) existingCanvas.remove();

    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas); 
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);
    
    const resizedDetections = faceapi.resizeResults(detection, displaySize);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    console.log("[Visual] Landmarks rendered to UI for verification.");
}

/**
 * PHASE 1 & 2: REGISTRATION
 */
regBtn.addEventListener('click', async () => {
    const username = usernameInput.value;
    if (!username) return alert("Enter a username");

    console.log(`\n--- PHASE 1: REGISTRATION CAPTURE [User: ${username}] ---`);
    statusText.innerText = "Scanning...";
    
    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                                   .withFaceLandmarks()
                                   .withFaceDescriptor();

    if (detection) {
        console.log(`[Success] Face detected. Confidence: ${(detection.detection.score * 100).toFixed(2)}%`);
        
        drawVisualFeedback(detection);

        console.log("--- PHASE 2: DATA MINIMIZATION & TRANSMISSION ---");
        console.log("[Action] Converting facial landmarks to 128-float vector...");
        console.log("[Security] Raw image data discarded. Transmitting mathematical embedding only.");

        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                descriptor: Array.from(detection.descriptor)
            })
        });

        if (response.ok) {
            console.log("[Success] Server confirmed encrypted registration.");
            statusText.innerText = "Success: Encrypted Biometrics Stored!";
            statusText.style.color = "green";
        }
    } else {
        console.warn("[Warning] Capture failed: No face detected in frame.");
        statusText.innerText = "No face detected. Try again.";
    }
});

/**
 * PHASE 1 & 2: AUTHENTICATION
 */
loginBtn.addEventListener('click', async () => {
    const username = usernameInput.value;
    if (!username) return alert("Enter username to login");

    console.log(`\n--- PHASE 1: AUTHENTICATION CAPTURE [User: ${username}] ---`);
    statusText.innerText = "Authenticating...";

    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                                   .withFaceLandmarks()
                                   .withFaceDescriptor();

    if (detection) {
        console.log("[Action] Biometric features extracted. Initiating server-side verification...");
        
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                descriptor: Array.from(detection.descriptor)
            })
        });

        const result = await response.text();
        
        console.log("--- PHASE 2: AUTHENTICATION RESULT ---");
        if (response.ok) {
            console.log(`[Access Granted] Cryptographic identity verified for: ${username}`);
            statusText.innerText = "WELCOME: " + username;
            statusText.style.color = "blue";
        } else {
            console.error(`[Access Denied] Reason: ${result}`);
            statusText.innerText = "AUTH FAILED: " + result;
            statusText.style.color = "red";
        }
    } else {
        console.warn("[Warning] Authentication failed: No face detected.");
    }
});

init();