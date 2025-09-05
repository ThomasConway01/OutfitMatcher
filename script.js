console.log('Written By Thomas Conway');
console.log('Script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    const homeBtn = document.getElementById('homeBtn');
    const visualizeBtn = document.getElementById('visualizeBtn');
    const wardrobeBtn = document.getElementById('wardrobeBtn');
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const captureButton = document.getElementById('capture');
    const resultDiv = document.getElementById('result');
    const wardrobeVideo = document.getElementById('wardrobeVideo');
    const scanWardrobeButton = document.getElementById('scanWardrobe');
    const wardrobeResultDiv = document.getElementById('wardrobeResult');

    const API_KEY = 'AIzaSyB4l_Ej36TJvMPLMtJ68-h-arTFM38XWAk'; // Note: In production, use environment variables

    let currentStream;
    let lastImageData;
    let lastPrompt;
    let lastResultDiv;
    let devices = [];

    function showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => section.style.display = 'none');
        document.getElementById(sectionId).style.display = 'block';
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
    }

    async function populateCameraSelect(selectElement) {
        try {
            devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            selectElement.innerHTML = '';
            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Camera ${index + 1}`;
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error('Error enumerating devices:', error);
        }
    }

    async function startCamera(videoElement, deviceId = null) {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported or not in secure context (HTTPS required on mobile)');
            }
            const constraints = {
                video: deviceId ? { deviceId: { exact: deviceId } } : true
            };
            currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = currentStream;
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Camera error: ' + error.message);
        }
    }

    async function analyzeImage(base64Image, prompt, resultDiv) {
        lastImageData = base64Image;
        lastPrompt = prompt;
        lastResultDiv = resultDiv;

        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Image
                        }
                    }
                ]
            }]
        };

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                const text = data.candidates[0].content.parts[0].text;
                resultDiv.textContent = text;
                // Show retry button
                if (resultDiv === document.getElementById('result')) {
                    document.getElementById('retry').style.display = 'inline-block';
                } else if (resultDiv === document.getElementById('wardrobeResult')) {
                    document.getElementById('retryWardrobe').style.display = 'inline-block';
                }
            } else {
                resultDiv.textContent = 'Error: Unexpected response format';
            }
        } catch (error) {
            console.error('Error analyzing image:', error);
            resultDiv.textContent = 'Error: ' + error.message;
        }
    }

    homeBtn.addEventListener('click', () => {
        console.log('Home clicked');
        showSection('home');
    });
    visualizeBtn.addEventListener('click', async () => {
        console.log('Visualize clicked');
        showSection('visualize');
        await populateCameraSelect(document.getElementById('cameraSelect'));
        startCamera(video);
    });
    wardrobeBtn.addEventListener('click', async () => {
        console.log('Wardrobe clicked');
        showSection('wardrobe');
        await populateCameraSelect(document.getElementById('wardrobeCameraSelect'));
        startCamera(wardrobeVideo);
    });

    document.getElementById('cameraSelect').addEventListener('change', (e) => {
        startCamera(video, e.target.value);
    });
    document.getElementById('wardrobeCameraSelect').addEventListener('change', (e) => {
        startCamera(wardrobeVideo, e.target.value);
    });

    captureButton.addEventListener('click', () => {
        captureButton.disabled = true;
        document.getElementById('loading').style.display = 'block';
        setTimeout(() => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            const imageData = canvas.toDataURL('image/jpeg').split(',')[1];
            analyzeImage(imageData, "Detect what clothes are in this image. Then recommend outfit combinations based on the detected clothes. Generate an image of what one outfit would look like when worn.", resultDiv);
            captureButton.disabled = false;
            document.getElementById('loading').style.display = 'none';
        }, 5000);
    });

    document.getElementById('retry').addEventListener('click', () => {
        if (lastImageData && lastPrompt && lastResultDiv) {
            analyzeImage(lastImageData, lastPrompt + " Please suggest a different outfit combination.", lastResultDiv);
        }
    });

    scanWardrobeButton.addEventListener('click', () => {
        scanWardrobeButton.disabled = true;
        document.getElementById('wardrobeLoading').style.display = 'block';
        setTimeout(() => {
            canvas.width = wardrobeVideo.videoWidth;
            canvas.height = wardrobeVideo.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(wardrobeVideo, 0, 0);
            const imageData = canvas.toDataURL('image/jpeg').split(',')[1];
            analyzeImage(imageData, "Detect all clothes in this wardrobe image. Then recommend outfit combinations from the detected items. Generate an image of what one outfit would look like when worn.", wardrobeResultDiv);
            scanWardrobeButton.disabled = false;
            document.getElementById('wardrobeLoading').style.display = 'none';
        }, 5000);
    });

    document.getElementById('retryWardrobe').addEventListener('click', () => {
        if (lastImageData && lastPrompt && lastResultDiv) {
            analyzeImage(lastImageData, lastPrompt + " Please suggest a different outfit combination.", lastResultDiv);
        }
    });
});
