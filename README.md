# StarLover - AI Voice Call Web App

StarLover is a voice call web app built with React and TypeScript, providing an experience of voice interaction with AI virtual characters. It uses Vite as the build tool and integrates a modern UI component library.

## Features

- 📞 Simulate voice call experience with AI virtual characters
- 🎙️ Voice recognition and text-to-speech functionality
- 💬 Support voice and text dual input modes
- 📱 Responsive design, suitable for different device screens
- 🎨 Beautiful user interface design, including audio waveform animation
- 🔄 Streaming response, real-time display of AI replies

## Tech Stack

- React 18.3
- TypeScript 5.5
- Vite 5.4
- Tailwind CSS
- Framer Motion (animation)
- Radix UI
- Web Speech API (voice recognition)

## Quick Start

### Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager

### Installation

1. Clone the repository

```bash
git clone https://github.com/starlover/starlover.git
cd starlover
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Start the development server

```bash
npm run dev
# or
yarn dev
```

The application will run on `http://localhost:5173`.

### Build the production version

```bash
npm run build
# or
yarn build
```

## Usage Guide

StarLover application provides a simple and intuitive user interface:

1. After entering the application, you will see a call interface, click the answer button to start the call
2. After the call is connected, you can interact with the AI in the following ways:
   - Use voice mode: click the microphone button to start voice input
   - Use text mode: switch to text input mode, input text and send
3. AI will reply to your questions through voice and text

## Custom Configuration

You can customize the application behavior by using the props of the `VoiceCall` component:

```jsx
<VoiceCall 
  callerName="Custom Name"
  callerAvatar="/path/to/avatar.jpg"
  description="Custom description"
  apiUrl={{
    callStatus: 'https://your-api.com/call-status',
    chatStream: 'https://your-api.com/chat-stream'
  }}
  debug={true}
/>
```

## API Endpoints

The application uses the following API endpoints by default:

- Call status: `/api/chat/call-status`
- Chat stream: `/api/chat/stream`

You can use your own backend service by modifying the `apiUrl` configuration in `App.tsx`.

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

## Contribution Guidelines

Welcome to contribute code, report issues, or suggest improvements. Please follow the steps below:

1. Fork the project repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Submit a Pull Request

## Contact

If you have any questions or suggestions, please contact us through Issues.