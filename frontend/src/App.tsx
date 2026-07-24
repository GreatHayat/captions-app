import { useState } from "react";
import { UploadScreen } from "./screens/UploadScreen";
import { EditorScreen } from "./screens/EditorScreen";
import type { VideoWithTranscript } from "./types";

const App = () => {
  const [result, setResult] = useState<VideoWithTranscript | null>(null);

  if (!result) {
    return <UploadScreen onUploaded={setResult} />;
  }

  return (
    <EditorScreen
      video={result.video}
      initialCues={result.cues}
      initialWords={result.words}
      initialHighlightedWords={result.highlightedWords}
      initialHighlightsGeneratedAt={result.highlightsGeneratedAt}
      onBack={() => setResult(null)}
    />
  );
};

export default App;
