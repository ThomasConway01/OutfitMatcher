console.log('🚀 Outfit Matcher - Cyberpunk Edition');
console.log('Written By Thomas Conway');

class OutfitMatcher {
    constructor() {
        this.apiKey = null;
        this.currentStream = null;
        this.lastImageData = null;
        this.lastPrompt = null;
        this.lastResultDiv = null;
        this.devices = [];
        this.rateLimitDelay = 2000; // 2 second minimum between requests
        this.lastRequestTime = 0;
        
        this.init();
    }

    init() {
        this.checkApiKey();
        this.setupEventListeners();
        this.setupModals();
    }

    // API Key Management
    checkApiKey() {
        // API key will be injected by GitHub Actions during deployment
        this.apiKey = 'GEMINI_API_KEY_PLACEHOLDER';
        
        // Fallback to localStorage for local development
        if (this.apiKey === 'GEMINI_API_KEY_PLACEHOLDER') {
            this.apiKey = localStorage.getItem('gemini_api_key');
            if (!this.apiKey) {
                console.warn('No API key found. For local development, add your key to localStorage.');
            }
        }
    }

    saveApiKey(key) {
        if (!key || key.trim().length < 10) {
            this.showError('Please enter a valid API key');
            return false;
        }
        
        localStorage.setItem('gemini_api_key', key.trim());
        this.apiKey = key.trim();
        this.showSuccess('API key saved successfully!');
        return true;
    }

    // UI Management
    showSection(sectionId) {
        // Remove active class from all sections and nav buttons
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected section and activate nav button
        document.getElementById(sectionId).classList.add('active');
        document.getElementById(sectionId + 'Btn').classList.add('active');

        // Stop current camera stream
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
    }

    showError(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">❌</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">✅</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Camera Management
    async populateCameraSelect(selectElement) {
        try {
            this.devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = this.devices.filter(device => device.kind === 'videoinput');
            
            selectElement.innerHTML = '<option value="">Select Camera...</option>';
            
            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Camera ${index + 1}`;
                selectElement.appendChild(option);
            });

            // Auto-select first camera if available
            if (videoDevices.length > 0) {
                selectElement.value = videoDevices[0].deviceId;
            }
        } catch (error) {
            console.error('Error enumerating devices:', error);
            this.showError('Failed to access camera devices');
        }
    }

    async startCamera(videoElement, deviceId = null) {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported. HTTPS required on mobile devices.');
            }

            // Stop existing stream
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
            console.error('Error accessing camera:', error);
            this.showError(`Camera error: ${error.message}`);
        }
    }

    // Rate Limiting
    async checkRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.rateLimitDelay) {
            const waitTime = this.rateLimitDelay - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
    }

    // AI Analysis
    async analyzeImage(base64Image, prompt, resultDiv, loadingDiv) {
        if (!this.apiKey) {
            this.showError('API key not configured. Please set your API key in settings.');
            return;
        }

        // Apply rate limiting
        await this.checkRateLimit();

        this.lastImageData = base64Image;
        this.lastPrompt = prompt;
        this.lastResultDiv = resultDiv;

        // Clear previous results and show loading
        resultDiv.innerHTML = '';
        loadingDiv.style.display = 'block';

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
                maxOutputTokens: 1024,
            }
        };

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                const text = data.candidates[0].content.parts[0].text;
                
                // Format and display result
                resultDiv.innerHTML = `
                    <div class="result-content">
                        <h3>🎨 Style Analysis</h3>
                        <div class="result-text">${this.formatResult(text)}</div>
                    </div>
                `;
                
                // Show retry button
                const retryBtn = resultDiv === document.getElementById('result') ? 
                    document.getElementById('retry') : document.getElementById('retryWardrobe');
                retryBtn.style.display = 'inline-flex';
                
            } else if (data.error) {
                throw new Error(data.error.message || 'API returned an error');
            } else {
                throw new Error('Unexpected response format from API');
            }
        } catch (error) {
            console.error('Error analyzing image:', error);
            resultDiv.innerHTML = `
                <div class="error-content">
                    <h3>❌ Analysis Failed</h3>
                    <p>${error.message}</p>
                    <p>Please check your API key and try again.</p>
                </div>
            `;
            this.showError(`Analysis failed: ${error.message}`);
        } finally {
            loadingDiv.style.display = 'none';
        }
    }

    formatResult(text) {
        // Basic formatting for better readability
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }

    // Image Capture
    captureImage(videoElement, canvasElement) {
        if (!videoElement.videoWidth || !videoElement.videoHeight) {
            throw new Error('Video not ready. Please wait for camera to initialize.');
        }

        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        
        const ctx = canvasElement.getContext('2d');
        ctx.drawImage(videoElement, 0, 0);
        
        return canvasElement.toDataURL('image/jpeg', 0.8).split(',')[1];
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.getElementById('homeBtn').addEventListener('click', () => {
            this.showSection('home');
        });

        document.getElementById('visualizeBtn').addEventListener('click', async () => {
            this.showSection('visualize');
            await this.populateCameraSelect(document.getElementById('cameraSelect'));
            this.startCamera(document.getElementById('video'));
        });

        document.getElementById('wardrobeBtn').addEventListener('click', async () => {
            this.showSection('wardrobe');
            await this.populateCameraSelect(document.getElementById('wardrobeCameraSelect'));
            this.startCamera(document.getElementById('wardrobeVideo'));
        });

        // Camera controls
        document.getElementById('cameraSelect').addEventListener('change', (e) => {
            if (e.target.value) {
                this.startCamera(document.getElementById('video'), e.target.value);
            }
        });

        document.getElementById('wardrobeCameraSelect').addEventListener('change', (e) => {
            if (e.target.value) {
                this.startCamera(document.getElementById('wardrobeVideo'), e.target.value);
            }
        });

        // Capture buttons
        document.getElementById('capture').addEventListener('click', async () => {
            const button = document.getElementById('capture');
            const video = document.getElementById('video');
            const canvas = document.getElementById('canvas');
            const resultDiv = document.getElementById('result');
            const loadingDiv = document.getElementById('loading');

            try {
                button.disabled = true;
                const imageData = this.captureImage(video, canvas);
                await this.analyzeImage(
                    imageData, 
                    "Analyze this clothing item in detail. Identify the type, color, style, and material if visible. Then provide specific outfit recommendations that would pair well with this item. Include styling tips and suggest complementary pieces like accessories, shoes, and other garments. Be creative and consider different occasions (casual, formal, work, etc.).",
                    resultDiv,
                    loadingDiv
                );
            } catch (error) {
                this.showError(error.message);
            } finally {
                button.disabled = false;
            }
        });

        document.getElementById('scanWardrobe').addEventListener('click', async () => {
            const button = document.getElementById('scanWardrobe');
            const video = document.getElementById('wardrobeVideo');
            const canvas = document.getElementById('canvas');
            const resultDiv = document.getElementById('wardrobeResult');
            const loadingDiv = document.getElementById('wardrobeLoading');

            try {
                button.disabled = true;
                const imageData = this.captureImage(video, canvas);
                await this.analyzeImage(
                    imageData,
                    "Analyze this wardrobe or clothing collection. Identify all visible clothing items, their colors, styles, and types. Then create multiple complete outfit combinations using only the items you can see. For each outfit suggestion, explain why the pieces work well together and what occasions they'd be suitable for. Be specific about which items to combine.",
                    resultDiv,
                    loadingDiv
                );
            } catch (error) {
                this.showError(error.message);
            } finally {
                button.disabled = false;
            }
        });

        // Retry buttons
        document.getElementById('retry').addEventListener('click', async () => {
            if (this.lastImageData && this.lastPrompt && this.lastResultDiv) {
                await this.analyzeImage(
                    this.lastImageData, 
                    this.lastPrompt + " Please provide completely different outfit suggestions with alternative styling approaches.",
                    this.lastResultDiv,
                    document.getElementById('loading')
                );
            }
        });

        document.getElementById('retryWardrobe').addEventListener('click', async () => {
            if (this.lastImageData && this.lastPrompt && this.lastResultDiv) {
                await this.analyzeImage(
                    this.lastImageData,
                    this.lastPrompt + " Please suggest completely different outfit combinations with alternative styling approaches.",
                    this.lastResultDiv,
                    document.getElementById('wardrobeLoading')
                );
            }
        });

        // Removed API Key modal - now using GitHub secrets

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.add('show');
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.remove('show');
        });

        document.getElementById('updateApiKey').addEventListener('click', () => {
            const input = document.getElementById('newApiKey');
            if (this.saveApiKey(input.value)) {
                input.value = '';
                document.getElementById('settingsModal').classList.remove('show');
            }
        });

        document.getElementById('clearHistory').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all data? This will remove your stored preferences.')) {
                localStorage.clear();
                this.showSuccess('All data cleared successfully');
                document.getElementById('settingsModal').classList.remove('show');
            }
        });
    }

    setupModals() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });

        // Handle Enter key in settings API key input
        const newApiKeyInput = document.getElementById('newApiKey');
        if (newApiKeyInput) {
            newApiKeyInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('updateApiKey').click();
                }
            });
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OutfitMatcher();
});

// Add toast styles dynamically
const toastStyles = `
    .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--cyber-bg-secondary);
        border: 2px solid var(--cyber-border);
        border-radius: 8px;
        padding: 1rem;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    }
    
    .toast.show {
        transform: translateX(0);
    }
    
    .toast.error {
        border-color: var(--cyber-danger);
        box-shadow: var(--cyber-glow) var(--cyber-danger);
    }
    
    .toast.success {
        border-color: var(--cyber-success);
        box-shadow: var(--cyber-glow) var(--cyber-success);
    }
    
    .toast-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--cyber-text);
    }
    
    .result-content h3 {
        color: var(--cyber-primary);
        margin-bottom: 1rem;
        font-size: 1.3rem;
    }
    
    .result-text {
        color: var(--cyber-text-dim);
        line-height: 1.6;
    }
    
    .result-text strong {
        color: var(--cyber-primary);
    }
    
    .result-text em {
        color: var(--cyber-secondary);
    }
    
    .error-content {
        text-align: center;
        color: var(--cyber-danger);
    }
    
    .error-content h3 {
        margin-bottom: 1rem;
    }
`;

// Inject toast styles
const styleSheet = document.createElement('style');
styleSheet.textContent = toastStyles;
document.head.appendChild(styleSheet);
