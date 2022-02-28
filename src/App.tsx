import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { FilePreviewer } from './FilePreviewer';

function App() {
  let filePre: FilePreviewer;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");

  const handleChange = async (evt: React.ChangeEvent) => {
    filePre.loadLocalFile(evt.nativeEvent);
    await filePre.waitRendered();
    const url = await filePre.getPreviewUrl();
    setUrl(url);
  };

  useEffect(() => {
    filePre = new FilePreviewer(canvasRef.current!);
  }, []);

  return (
    <div className="App">
      <div style={{ display: "flex", height: 100 }}>
        <input type="file" multiple onChange={handleChange} />
        <img width={100} height={100} src={url} alt="" />
      </div>
      <div style={{ height: "60%" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }}></canvas>
      </div>
    </div>
  );
}

export default App;
