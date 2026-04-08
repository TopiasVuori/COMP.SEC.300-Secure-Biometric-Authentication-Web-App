const video = document.getElementById('webcam');
const statusText = document.getElementById('status');
const regBtn = document.getElementById('reg-btn');
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('username');

async function init() {
    try {
        // Load models locally
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);

        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
        
        regBtn.disabled = false;
        statusText.innerText = "Status: Ready";
    } catch (err) {
        statusText.innerText = "Status: Initialization Error";
    }
}

regBtn.addEventListener('click', async () => {
    const username = usernameInput.value;
    if (!username) return alert("Enter a username");

    statusText.innerText = "Scanning...";
    
    // Extract face descriptor
    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                                   .withFaceLandmarks()
                                   .withFaceDescriptor();

    if (detection) {
        // Create a temporary canvas to show the "scan" result
        const canvas = faceapi.createCanvasFromMedia(video);
        document.body.append(canvas); // This adds a second image below your video
        
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);
        
        const resizedDetections = faceapi.resizeResults(detection, displaySize);
        
        // Draw the "Face Box" and "Landmarks" so you can see the input
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

        console.log("--- SECURE DATA CAPTURE ---");
        // This shows the coordinates of your eyes, nose, and mouth
        console.log("Landmarks:", detection.landmarks); 
        
        // This is the mathematical "Face": 128 numbers
        console.log("Descriptor (The 'Face' the server sees):", detection.descriptor);

        // This is the confidence score (e.g., 0.99 means 99% sure it's a face)
        console.log("Detection Confidence:", detection.detection.score);

        // Send the 128-float array to server
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                descriptor: Array.from(detection.descriptor)
            })
        });

        if (response.ok) {
            statusText.innerText = "Success: Encrypted Biometrics Stored!";
            statusText.style.color = "green";
        }
    } else {
        statusText.innerText = "No face detected. Try again.";
    }
});

loginBtn.addEventListener('click', async () => {
    const username = usernameInput.value;
    statusText.innerText = "Authenticating...";

    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                                   .withFaceLandmarks()
                                   .withFaceDescriptor();

    if (detection) {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                descriptor: Array.from(detection.descriptor)
            })
        });

        const result = await response.text();
        if (response.ok) {
            statusText.innerText = "WELCOME: " + username;
            statusText.style.color = "blue";
        } else {
            statusText.innerText = "AUTH FAILED: " + result;
            statusText.style.color = "red";
        }
    }
});

init();