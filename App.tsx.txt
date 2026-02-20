import React, { useState, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { GoogleGenAI } from '@google/genai';
import { IMAGE_SHOTS } from './constants';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export default function App() {
  const [hasKey, setHasKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);

  const [tops, setTops] = useState<File[]>([]);
  const [bottoms, setBottoms] = useState<File[]>([]);
  const [shoeInfo, setShoeInfo] = useState({ image: null as File | null, text: '' });
  const [selectedShots, setSelectedShots] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isGifSelected, setIsGifSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio?.hasSelectedApiKey) {
          const has = await window.aistudio.hasSelectedApiKey();
          setHasKey(has);
        } else {
          setHasKey(true);
        }
      } catch (e) {
        setHasKey(true);
      } finally {
        setCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    try {
      if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey();
        setHasKey(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async () => {
    if (tops.length === 0 && bottoms.length === 0) {
      alert("상의나 하의를 최소 1장 이상 업로드해주세요.");
      return;
    }
    if (selectedShots.length === 0) {
      alert("작업(샷)을 최소 1개 이상 선택해주세요.");
      return;
    }

    setLoading(true);
    setGeneratedImage(null);

    try {
      // Create a new instance right before the call
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const shotPrompts = selectedShots.map(id => {
        const shot = IMAGE_SHOTS.find(s => s.id === id);
        return shot ? `- ${shot.name}: ${shot.prompt}` : null;
      }).filter(Boolean);

      let prompt = `Generate a high-quality fashion model photo wearing the provided clothing items.
Strictly adhere to the following constraints:
- Use a vertical portrait orientation (9:16) to emphasize the clothing fit from the neck down.
- NO face, NO head, NO eyes, NO facial features.
- Focus on a 'Chin-down view'. Ensure the cut-off point is exactly at the lower jaw.
- All shots must be cropped at the model's jawline so the face does not appear. Maintain a professional fashion lookbook style.
`;

      if (shotPrompts.length > 0) {
        prompt += `\nRequested Shots/Poses:\n${shotPrompts.join('\n')}`;
      }

      if (shoeInfo.text) {
        prompt += `\nShoes description: ${shoeInfo.text}`;
      }

      const parts: any[] = [{ text: prompt }];

      for (const file of tops) {
        const base64 = await fileToBase64(file);
        parts.push({
          inlineData: {
            data: base64,
            mimeType: file.type
          }
        });
      }

      for (const file of bottoms) {
        const base64 = await fileToBase64(file);
        parts.push({
          inlineData: {
            data: base64,
            mimeType: file.type
          }
        });
      }

      if (shoeInfo.image) {
        const base64 = await fileToBase64(shoeInfo.image);
        parts.push({
          inlineData: {
            data: base64,
            mimeType: shoeInfo.image.type
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: parts
        },
        config: {
          imageConfig: {
            aspectRatio: "9:16",
            imageSize: "1K"
          }
        }
      });

      let newImageUrl = null;
      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            newImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (newImageUrl) {
        setGeneratedImage(newImageUrl);
      } else {
        alert("이미지 생성에 실패했습니다. (응답에 이미지가 없습니다)");
      }

    } catch (error: any) {
      console.error("Generation error:", error);
      if (error.message && error.message.includes("Requested entity was not found")) {
         alert("API 키가 유효하지 않거나 권한이 없습니다. 다시 선택해주세요.");
         setHasKey(false);
      } else {
         alert("이미지 생성 중 오류가 발생했습니다: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingKey) {
    return <div className="flex h-screen items-center justify-center bg-gray-100">Loading...</div>;
  }

  if (!hasKey) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">API 키가 필요합니다</h2>
          <p className="text-gray-600 mb-6">
            이 애플리케이션은 고품질 이미지 생성을 위해 Gemini 3 Pro Image 모델을 사용하며, 결제가 설정된 Google Cloud API 키가 필요합니다.
            <br/><br/>
            계속하려면 API 키를 선택해주세요.
            <br/>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">결제 설정 알아보기</a>
          </p>
          <button 
            onClick={handleSelectKey}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700"
          >
            API 키 선택
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-[400px] h-full bg-white shadow-lg z-10">
        <ControlPanel 
          tops={tops} setTops={setTops}
          bottoms={bottoms} setBottoms={setBottoms}
          shoeInfo={shoeInfo} setShoeInfo={setShoeInfo}
          selectedShots={selectedShots} setSelectedShots={setSelectedShots}
          selectedVideo={selectedVideo} setSelectedVideo={setSelectedVideo}
          isGifSelected={isGifSelected} setIsGifSelected={setIsGifSelected}
          onGenerate={handleGenerate}
          loading={loading}
        />
      </div>
      <div className="flex-1 flex items-center justify-center bg-gray-50 relative overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">AI 모델 '민수'가 옷을 입어보는 중입니다...</p>
          </div>
        ) : generatedImage ? (
          <div className="w-full h-full p-8 flex items-center justify-center">
            <img 
              src={generatedImage} 
              alt="Generated Fashion" 
              className="max-h-full max-w-full object-contain shadow-2xl rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <p className="text-gray-400">여기에 AI 모델 '민수'의 착장 이미지가 나타납니다.</p>
        )}
      </div>
    </div>
  );
}
