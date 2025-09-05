# 👗 Outfit Matcher - AI Fashion Assistant

A cyberpunk-styled web application that uses Google's Gemini AI to analyze your wardrobe and provide instant outfit recommendations.

![Cyberpunk UI](https://img.shields.io/badge/UI-Cyberpunk-00ffff?style=for-the-badge)
![AI Powered](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-ff00ff?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Live-00ff41?style=for-the-badge)

## 🚀 Live Demo

**Try it now:** [https://thomasconway01.github.io/OutfitMatcher](https://thomasconway01.github.io/OutfitMatcher)

## ✨ Features

### 🎨 **Cyberpunk UI**
- Neon color scheme with glowing effects
- Smooth animations and transitions
- Responsive design for all devices
- Professional glass morphism effects

### 🤖 **AI-Powered Analysis**
- **Wardrobe Scanner**: Take a photo of your clothing collection
- **Brief Overview**: Get a simple list of clothing items and colors
- **Outfit Suggestions**: Receive one complete outfit recommendation
- **Retry Function**: Get different outfit combinations

### 📱 **Modern Features**
- Camera integration with device selection
- Real-time video preview
- Instant capture and analysis
- Local storage for API key management

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **AI**: Google Gemini 1.5 Flash API
- **Camera**: WebRTC getUserMedia API
- **Deployment**: GitHub Pages
- **Styling**: Custom CSS with cyberpunk theme

## 🎯 How It Works

1. **📸 Take Photo**: Capture your wardrobe or clothing collection
2. **🤖 AI Analysis**: Gemini AI identifies clothing items and colors
3. **✨ Get Suggestions**: Receive one complete outfit recommendation
4. **🔄 Try Again**: Get different combinations with the retry button

## 🚀 Quick Start

### Option 1: Use the Live App (Recommended)
1. Visit [https://thomasconway01.github.io/OutfitMatcher](https://thomasconway01.github.io/OutfitMatcher)
2. Click "Start Wardrobe Scan"
3. Allow camera access
4. Enter your Gemini API key when prompted
5. Take a photo and get instant outfit suggestions!

### Option 2: Run Locally
```bash
# Clone the repository
git clone https://github.com/ThomasConway01/OutfitMatcher.git

# Navigate to the project
cd OutfitMatcher

# Serve locally (Python example)
python -m http.server 8080

# Open in browser
open http://localhost:8080
```

## 🔑 API Key Setup

### Get Your Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

### Using Your API Key
- **Live App**: Enter your key when prompted (saved locally)
- **Local Development**: Store in localStorage or modify the code

## 📱 Usage

### Taking Photos
- **Good lighting** helps AI analysis
- **Include multiple items** for better outfit suggestions
- **Clear, unobstructed view** of clothing works best

### Camera Tips
- Use the camera selector to switch between front/back cameras
- Wait for the camera to initialize before capturing
- The app works on both desktop and mobile devices

## 🎨 UI Highlights

### Cyberpunk Theme
- **Neon colors**: Cyan, magenta, and yellow accents
- **Glowing effects**: CSS box-shadows and animations
- **Dark background**: Deep space-like gradients
- **Modern typography**: Inter font family

### Responsive Design
- **Mobile-first**: Optimized for touch devices
- **Desktop-friendly**: Full-featured experience
- **Cross-browser**: Works on modern browsers

## 🔧 Development

### Project Structure
```
OutfitMatcher/
├── index.html          # Main HTML structure
├── styles.css          # Cyberpunk styling
├── script.js           # Core functionality
├── .github/
│   └── workflows/
│       └── build.yml   # GitHub Actions deployment
└── README.md           # This file
```

### Key Components
- **OutfitMatcher Class**: Main application logic
- **Camera Management**: Device enumeration and stream handling
- **AI Integration**: Gemini API communication
- **UI Management**: Section switching and state management

## 🚀 Deployment

The app is automatically deployed to GitHub Pages using GitHub Actions:

1. **Push to main branch**
2. **GitHub Actions builds the app**
3. **API key injection** (if configured)
4. **Deploy to GitHub Pages**

### Manual Deployment
If GitHub Actions isn't working:
1. The app works directly from the repository
2. Users can enter their API key manually
3. No build process required for basic functionality

## 🔒 Security

- **No API keys in code**: Keys are injected during deployment or entered by users
- **Local storage**: API keys stored securely in browser
- **HTTPS required**: Camera access requires secure context
- **No server**: Pure client-side application

## 🎯 Features in Detail

### Wardrobe Analysis
```javascript
// Simple, focused analysis
const prompt = "Look at this image and tell me what clothing items you can see. 
Then suggest one outfit combination from these items. Keep it brief and simple.";
```

### Error Handling
- **Network errors**: Clear error messages
- **API failures**: Specific error types identified
- **Camera issues**: Helpful troubleshooting
- **Rate limiting**: Built-in request throttling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Thomas Conway**
- GitHub: [@ThomasConway01](https://github.com/ThomasConway01)
- Project: [OutfitMatcher](https://github.com/ThomasConway01/OutfitMatcher)

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful image analysis
- **GitHub Pages** for free hosting
- **WebRTC** for camera functionality
- **CSS Grid & Flexbox** for responsive layouts

## 📊 Project Stats

- **Lines of Code**: ~500 JavaScript, ~800 CSS
- **Bundle Size**: Minimal (no dependencies)
- **Performance**: Instant loading, fast AI responses
- **Compatibility**: Modern browsers with camera support

---

**Made with ❤️ and lots of ☕ | Powered by Google Gemini AI**

*Transform your style with AI-powered fashion recommendations!* ✨👔👗