import VoiceCall from './components/voice-call/VoiceCall';

function App() {
  const apiUrl = {
    callStatus: "https://voice.hydramcp.xyz/api/chat/call-status",
    chatStream: "https://voice.hydramcp.xyz/api/chat/stream"
  }
  return (
    <VoiceCall apiUrl={apiUrl} />
  );
}

export default App;
