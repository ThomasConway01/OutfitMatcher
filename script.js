console.log('🚀 Outfit Matcher - Simple Edition');
console.log('Written By Thomas Conway');

class OutfitMatcher {
    constructor() {
        this.apiKey = 'GEMINI_API_KEY_PLACEHOLDER';
        this.currentStream = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    // UI Management
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remove active from nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Activate nav button
        const navBtn = document.getElementById(sectionId + 'Btn');
        if (navBtn) {
            navBtn.classList.add('active');
        }

        // Stop current camera stream
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }

        // Start camera if going to wardrobe section
        if (sectionId === 'wardrobe') {
            setTimeout(() => {
                this.initCamera();
            }, 200);
        }
    }

    async initCamera() {
        try {
            const video = document.getElementById('wardrobeVideo');
            const select = document.getElementById('wardrobeCameraSelect');
            
            if (!video || !select) return;

            // Get available cameras
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            // Populate camera select
            select.innerHTML = '<option value="">Select Camera...</option>';
            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Camera ${index + 1}`;
                select.appendChild(option);
            });

            // Start with first camera
            if (videoDevices.length > 0) {
                select.value = videoDevices[0].deviceId;
                this.startCamera(video, videoDevices[0].deviceId);
            }
        } catch (error) {
            console.error('Camera init error:', error);
            this.showError('Failed to initialize camera');
        }
    }

    async startCamera(videoElement, deviceId = null) {
        try {
            if (this.currentStream) {
                this.currentStream.getTracks().forEach(track => track.stop());
            }

            const constraints = {
                video: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = this.currentStream;
        } catch (error) {
            console.error('Camera error:', error);
            this.showError('Camera access failed: ' + error.message);
        }
    }

    // Image Capture
    captureImage(videoElement) {
        if (!videoElement.videoWidth || !videoElement.videoHeight) {
            throw new Error('Video not ready. Please wait for camera to initialize.');
        }

        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0);
        
        return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    }

    // AI Analysis - Simple version for wardrobe overview and outfit suggestion
    async analyzeWardrobe(base64Image) {
        const loadingDiv = document.getElementById('wardrobeLoading');
        const resultDiv = document.getElementById('wardrobeResult');
        
        loadingDiv.style.display = 'block';
        resultDiv.innerHTML = '';

        // Check if API key is properly set
        if (!this.apiKey || this.apiKey === 'GEMINI_API_KEY_PLACEHOLDER') {
            // Try to get API key from user as fallback
            const userApiKey = prompt('GitHub secrets not working. Please enter your Gemini API key:');
            if (userApiKey && userApiKey.trim().length > 10) {
                this.apiKey = userApiKey.trim();
                localStorage.setItem('gemini_api_key', this.apiKey);
            } else {
                resultDiv.innerHTML = `
                    <div class="error-content">
                        <h3>❌ API Key Missing</h3>
                        <p>GitHub secrets not configured properly. Please:</p>
                        <ol style="text-align: left; margin: 1rem 0;">
                            <li>Check your GEMINI_API_KEY secret in GitHub</li>
                            <li>Or refresh and enter your API key when prompted</li>
                        </ol>
                    </div>
                `;
                loadingDiv.style.display = 'none';
                return;
            }
        }

        const prompt = `Look at this image and tell me what clothing items you can see. Then suggest one outfit combination from these items. Keep it brief and simple.`;

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
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 512
            }
        };

        try {
            console.log('Making API request to Gemini...');
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`API Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('API Response:', data);
            
            if (data.error) {
                throw new Error(`API Error: ${data.error.message || 'Unknown error'}`);
            }
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                const text = data.candidates[0].content.parts[0].text;
                
                resultDiv.innerHTML = `
                    <div class="result-content">
                        <h3>👔 Wardrobe Analysis</h3>
                        <div class="result-text">${this.formatResult(text)}</div>
                    </div>
                `;
                
                const retryBtn = document.getElementById('retryWardrobe');
                if (retryBtn) {
                    retryBtn.style.display = 'inline-flex';
                }
            } else if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === 'SAFETY') {
                resultDiv.innerHTML = `
                    <div class="error-content">
                        <h3>⚠️ Content Filtered</h3>
                        <p>The image was filtered for safety reasons. Please try a different photo.</p>
                    </div>
                `;
            } else {
                console.error('Unexpected response structure:', data);
                resultDiv.innerHTML = `
                    <div class="error-content">
                        <h3>❌ Unexpected Response</h3>
                        <p>Received unexpected response from AI. Please try again.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Analysis error:', error);
            
            let errorMessage = 'Unknown error occurred';
            if (error.message.includes('API Error 400')) {
                errorMessage = 'Invalid request. Please try a different image.';
            } else if (error.message.includes('API Error 403')) {
                errorMessage = 'API key invalid or quota exceeded.';
            } else if (error.message.includes('API Error 429')) {
                errorMessage = 'Too many requests. Please wait a moment and try again.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Network error. Please check your connection.';
            } else {
                errorMessage = error.message;
            }
            
            resultDiv.innerHTML = `
                <div class="error-content">
                    <h3>❌ Analysis Failed</h3>
                    <p>${errorMessage}</p>
                    <p><small>Check console for more details.</small></p>
                </div>
            `;
        } finally {
            loadingDiv.style.display = 'none';
        }
    }

    formatResult(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }

    showError(message) {
        console.error('Error:', message);
        alert('Error: ' + message);
    }

    showSuccess(message) {
        console.log('Success:', message);
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.getElementById('homeBtn').addEventListener('click', () => {
            this.showSection('home');
        });

        document.getElementById('wardrobeBtn').addEventListener('click', () => {
            this.showSection('wardrobe');
        });

        // CTA button on home page
        const startScanBtn = document.getElementById('startScanBtn');
        if (startScanBtn) {
            startScanBtn.addEventListener('click', () => {
                this.showSection('wardrobe');
            });
        }

        // Camera controls
        const wardrobeCameraSelect = document.getElementById('wardrobeCameraSelect');
        if (wardrobeCameraSelect) {
            wardrobeCameraSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    const video = document.getElementById('wardrobeVideo');
                    this.startCamera(video, e.target.value);
                }
            });
        }

        // Scan wardrobe button
        const scanWardrobeBtn = document.getElementById('scanWardrobe');
        if (scanWardrobeBtn) {
            scanWardrobeBtn.addEventListener('click', async () => {
                const video = document.getElementById('wardrobeVideo');
                
                if (!video || !video.videoWidth) {
                    this.showError('Please wait for camera to initialize');
                    return;
                }

                try {
                    scanWardrobeBtn.disabled = true;
                    const imageData = this.captureImage(video);
                    await this.analyzeWardrobe(imageData);
                } catch (error) {
                    this.showError(error.message);
                } finally {
                    scanWardrobeBtn.disabled = false;
                }
            });
        }

        // Retry wardrobe button
        const retryWardrobeBtn = document.getElementById('retryWardrobe');
        if (retryWardrobeBtn) {
            retryWardrobeBtn.addEventListener('click', async () => {
                const video = document.getElementById('wardrobeVideo');
                
                if (!video || !video.videoWidth) {
                    this.showError('Please wait for camera to initialize');
                    return;
                }

                try {
                    retryWardrobeBtn.disabled = true;
                    const imageData = this.captureImage(video);
                    await this.analyzeWardrobe(imageData);
                } catch (error) {
                    this.showError(error.message);
                } finally {
                    retryWardrobeBtn.disabled = false;
                }
            });
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OutfitMatcher();
});