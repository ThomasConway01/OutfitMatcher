console.log('🚀 Outfit Matcher - Simple Edition');
console.log('Written By Thomas Conway');

class OutfitMatcher {
    constructor() {
        this.apiKey = 'OPENROUTER_API_KEY_PLACEHOLDER';
        this.textModel = 'anthropic/claude-3.5-sonnet';
        this.imageModel = 'black-forest-labs/flux-schnell';
        this.currentStream = null;
        this.clearOldApiKeys();
        this.init();
    }

    // Clear old API keys from localStorage
    clearOldApiKeys() {
        // Remove old Gemini and Groq keys
        localStorage.removeItem('gemini_api_key');
        localStorage.removeItem('groq_api_key');
        console.log('Cleared old API keys from localStorage');
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
        if (!this.apiKey || this.apiKey === 'OPENROUTER_API_KEY_PLACEHOLDER') {
            // Check localStorage first
            const storedKey = localStorage.getItem('openrouter_api_key');
            if (storedKey && storedKey.trim().length > 10) {
                this.apiKey = storedKey.trim();
            } else {
                // Show error message with instructions
                resultDiv.innerHTML = `
                    <div class="error-content">
                        <h3>❌ API Key Missing</h3>
                        <p>OpenRouter API key not configured.</p>
                        <div style="margin: 1rem 0; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 8px;">
                            <p><strong>To fix this:</strong></p>
                            <ol style="text-align: left; margin: 0.5rem 0;">
                                <li>Get your API key from <a href="https://openrouter.ai/keys" target="_blank" style="color: var(--cyber-primary);">OpenRouter Console</a></li>
                                <li>Enter it below:</li>
                            </ol>
                            <input type="password" id="tempApiKey" placeholder="Paste your OpenRouter API key here" style="width: 100%; padding: 0.5rem; margin: 0.5rem 0; background: var(--cyber-bg); border: 2px solid var(--cyber-border); color: var(--cyber-text); border-radius: 4px;">
                            <button onclick="window.outfitMatcher.setTempApiKey()" style="padding: 0.5rem 1rem; background: var(--cyber-primary); color: var(--cyber-bg); border: none; border-radius: 4px; cursor: pointer;">Save & Try Again</button>
                        </div>
                    </div>
                `;
                loadingDiv.style.display = 'none';
                return;
            }
        }

        const aiPrompt = `Look at this image and tell me what clothing items you can see. Then suggest one outfit combination from these items. Keep it brief and simple.`;

        const requestBody = {
            model: this.textModel,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: aiPrompt
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 512,
            temperature: 0.7
        };

        try {
            console.log('Making API request to OpenRouter...');
            
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Outfit Matcher'
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
            
            if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                const text = data.choices[0].message.content;
                
                resultDiv.innerHTML = `
                    <div class="result-content">
                        <h3>👔 Wardrobe Analysis</h3>
                        <div class="result-text">${this.formatResult(text)}</div>
                    </div>
                `;
                
                // Store the current outfit for chat context
                this.currentOutfit = text;
                this.currentImage = base64Image;
                
                // Show retry button and chat interface
                const retryBtn = document.getElementById('retryWardrobe');
                if (retryBtn) {
                    retryBtn.style.display = 'inline-flex';
                }
                
                // Show chat interface
                this.showChatInterface();
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

    // Method to set API key from the temporary input
    setTempApiKey() {
        const input = document.getElementById('tempApiKey');
        if (input && input.value && input.value.trim().length > 10) {
            this.apiKey = input.value.trim();
            localStorage.setItem('openrouter_api_key', this.apiKey);
            
            // Clear the input and show success
            input.value = '';
            
            // Show success message
            const resultDiv = document.getElementById('wardrobeResult');
            resultDiv.innerHTML = `
                <div class="result-content">
                    <h3>✅ API Key Saved</h3>
                    <p>API key saved successfully! You can now scan your wardrobe.</p>
                </div>
            `;
        } else {
            alert('Please enter a valid API key (at least 10 characters)');
        }
    }

    // Show chat interface after outfit analysis
    showChatInterface() {
        const chatContainer = document.getElementById('outfitChat');
        if (chatContainer) {
            chatContainer.style.display = 'block';
            
            // Clear previous chat messages
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = `
                <div class="chat-message ai">
                    <div class="message-header">🤖 AI Fashion Assistant</div>
                    <div class="message-content">I've analyzed your wardrobe! Feel free to ask me questions about the outfit suggestion, like "What shoes would work?" or "Can I wear this to work?"</div>
                </div>
            `;
            
            // Scroll to chat
            chatContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Handle chat messages
    async sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const chatMessages = document.getElementById('chatMessages');
        const sendBtn = document.getElementById('sendChatBtn');
        
        if (!chatInput.value.trim()) return;
        
        const userMessage = chatInput.value.trim();
        chatInput.value = '';
        
        // Add user message to chat
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'chat-message user';
        userMessageDiv.innerHTML = `
            <div class="message-header">👤 You</div>
            <div class="message-content">${userMessage}</div>
        `;
        chatMessages.appendChild(userMessageDiv);
        
        // Disable send button
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span class="icon">⏳</span><span>Thinking...</span>';
        
        try {
            // Create context-aware prompt
            const contextPrompt = `Based on this wardrobe analysis and outfit suggestion: "${this.currentOutfit}"
            
            The user is asking: "${userMessage}"
            
            Please provide a helpful, specific answer about the outfit. Keep it conversational and brief. Focus on practical fashion advice.`;
            
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Outfit Matcher'
                },
                body: JSON.stringify({
                    model: this.textModel,
                    messages: [
                        {
                            role: "user",
                            content: contextPrompt
                        }
                    ],
                    max_tokens: 256,
                    temperature: 0.8
                })
            });
            
            const data = await response.json();
            
            if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                const aiResponse = data.choices[0].message.content;
                
                // Add AI response to chat
                const aiMessageDiv = document.createElement('div');
                aiMessageDiv.className = 'chat-message ai';
                aiMessageDiv.innerHTML = `
                    <div class="message-header">🤖 AI Fashion Assistant</div>
                    <div class="message-content">${this.formatResult(aiResponse)}</div>
                `;
                chatMessages.appendChild(aiMessageDiv);
            } else {
                throw new Error('No response from AI');
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessageDiv = document.createElement('div');
            errorMessageDiv.className = 'chat-message ai';
            errorMessageDiv.innerHTML = `
                <div class="message-header">🤖 AI Fashion Assistant</div>
                <div class="message-content">Sorry, I couldn't process that question. Please try asking something else about your outfit!</div>
            `;
            chatMessages.appendChild(errorMessageDiv);
        } finally {
            // Re-enable send button
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<span class="icon">💬</span><span>Ask</span>';
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // Generate outfit visualization
    async generateOutfitVisualization() {
        const visualizationContainer = document.getElementById('outfitVisualization');
        const loadingDiv = document.getElementById('visualizationLoading');
        const resultDiv = document.getElementById('visualizationResult');
        
        // Show visualization section
        visualizationContainer.style.display = 'block';
        loadingDiv.style.display = 'block';
        resultDiv.innerHTML = '';
        
        // Scroll to visualization
        visualizationContainer.scrollIntoView({ behavior: 'smooth' });
        
        try {
            // First, create a detailed prompt using the text model
            const promptCreationResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Outfit Matcher'
                },
                body: JSON.stringify({
                    model: this.textModel,
                    messages: [
                        {
                            role: "user",
                            content: `Create a detailed, visual prompt for AI image generation based on this outfit analysis: "${this.currentOutfit}"

                            Make it a concise but descriptive prompt for generating a fashion illustration or realistic outfit photo. Focus on:
                            - Specific clothing items and their colors
                            - Style and fit details
                            - How pieces work together
                            - Professional fashion photography style
                            
                            Keep it under 100 words and suitable for FLUX image generation.`
                        }
                    ],
                    max_tokens: 200,
                    temperature: 0.7
                })
            });
            
            const promptData = await promptCreationResponse.json();
            
            if (!promptData.choices || !promptData.choices[0] || !promptData.choices[0].message) {
                throw new Error('Failed to create image prompt');
            }
            
            const imagePrompt = promptData.choices[0].message.content.trim();
            console.log('Generated image prompt:', imagePrompt);
            
            // Now generate the actual image using FLUX
            const imageResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Outfit Matcher'
                },
                body: JSON.stringify({
                    model: this.imageModel,
                    messages: [
                        {
                            role: "user",
                            content: imagePrompt
                        }
                    ],
                    max_tokens: 1,
                    temperature: 0.7
                })
            });
            
            const imageData = await imageResponse.json();
            console.log('Image generation response:', imageData);
            
            // Check if we got an image URL back
            if (imageData.choices && imageData.choices[0] && imageData.choices[0].message && imageData.choices[0].message.content) {
                const imageUrl = imageData.choices[0].message.content.trim();
                
                // Display the generated image
                resultDiv.innerHTML = `
                    <div class="result-content">
                        <h3>🎨 Generated Outfit Visualization</h3>
                        <div style="margin: 1rem 0;">
                            <img src="${imageUrl}" alt="Generated outfit visualization" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,255,255,0.3);">
                        </div>
                        <div class="result-text">
                            <p><strong>Prompt used:</strong> ${imagePrompt}</p>
                        </div>
                    </div>
                `;
            } else {
                // Fallback to showing the prompt if image generation fails
                resultDiv.innerHTML = `
                    <div class="result-content">
                        <h3>🎨 Outfit Visualization Prompt</h3>
                        <div class="result-text">${this.formatResult(imagePrompt)}</div>
                        <div style="margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 8px;">
                            <p><strong>💡 Image generation is processing...</strong></p>
                            <p>The FLUX model is generating your outfit visualization. This may take a moment.</p>
                            <p>You can also copy this prompt and use it with other AI image generators:</p>
                            <ul style="text-align: left; margin: 0.5rem 0;">
                                <li><a href="https://www.midjourney.com" target="_blank" style="color: var(--cyber-primary);">Midjourney</a></li>
                                <li><a href="https://openai.com/dall-e-2" target="_blank" style="color: var(--cyber-primary);">DALL-E</a></li>
                                <li><a href="https://stability.ai/stable-diffusion" target="_blank" style="color: var(--cyber-primary);">Stable Diffusion</a></li>
                            </ul>
                        </div>
                    </div>
                `;
            }
            
            const regenerateBtn = document.getElementById('regenerateVisualizationBtn');
            if (regenerateBtn) {
                regenerateBtn.style.display = 'inline-flex';
            }
            
        } catch (error) {
            console.error('Visualization error:', error);
            resultDiv.innerHTML = `
                <div class="error-content">
                    <h3>❌ Visualization Failed</h3>
                    <p>Sorry, couldn't generate the outfit visualization. Error: ${error.message}</p>
                    <p><small>Check console for more details.</small></p>
                </div>
            `;
        } finally {
            loadingDiv.style.display = 'none';
        }
    }

    // Start over - reset everything
    startOver() {
        // Hide chat and visualization
        document.getElementById('outfitChat').style.display = 'none';
        document.getElementById('outfitVisualization').style.display = 'none';
        
        // Clear results
        document.getElementById('wardrobeResult').innerHTML = `
            <div class="result-placeholder">
                <div class="placeholder-icon">👔</div>
                <p>Your wardrobe analysis will appear here</p>
            </div>
        `;
        
        // Hide retry button
        document.getElementById('retryWardrobe').style.display = 'none';
        
        // Clear stored data
        this.currentOutfit = null;
        this.currentImage = null;
        
        // Scroll back to camera
        document.getElementById('wardrobeVideo').scrollIntoView({ behavior: 'smooth' });
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

        // Chat functionality
        const sendChatBtn = document.getElementById('sendChatBtn');
        if (sendChatBtn) {
            sendChatBtn.addEventListener('click', () => {
                this.sendChatMessage();
            });
        }

        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });
        }

        // Visualization functionality
        const visualizeOutfitBtn = document.getElementById('visualizeOutfitBtn');
        if (visualizeOutfitBtn) {
            visualizeOutfitBtn.addEventListener('click', () => {
                this.generateOutfitVisualization();
            });
        }

        const regenerateVisualizationBtn = document.getElementById('regenerateVisualizationBtn');
        if (regenerateVisualizationBtn) {
            regenerateVisualizationBtn.addEventListener('click', () => {
                this.generateOutfitVisualization();
            });
        }

        // Navigation buttons
        const startOverBtn = document.getElementById('startOverBtn');
        if (startOverBtn) {
            startOverBtn.addEventListener('click', () => {
                this.startOver();
            });
        }

        const backToChatBtn = document.getElementById('backToChatBtn');
        if (backToChatBtn) {
            backToChatBtn.addEventListener('click', () => {
                document.getElementById('outfitVisualization').style.display = 'none';
                document.getElementById('outfitChat').scrollIntoView({ behavior: 'smooth' });
            });
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.outfitMatcher = new OutfitMatcher();
});