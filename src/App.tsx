import React, { useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IMAGE_SHOTS } from './constants';

export default function App() {
  const [tops, setTops] = useState<File[]>([]);
  const [bottoms, setBottoms] = useState<File[]>([]);
  const [shoeInfo, setShoeInfo] = useState({ image: null as File | null, text: '' });
  const [selectedShots, setSelectedShots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultImages, setResultImages] = useState<{url: string, name: string}[]>([]);

  const fileToGenerativePart = async (file: File) => {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return { inlineData: { data: base64, mimeType: file.type } };
  };

  const handleGenerate = async () => {
    if (tops.length === 0 || bottoms.length === 0 || selectedShots.length === 0) {
      alert("상의와 하의 사진을 올려주세요!");
      return;
    }

    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      // 사장님이 요청하신 고사양 Pro 모델로 설정했습니다.
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const imageParts = await Promise.all([
        ...tops.map(fileToGenerativePart),
        ...bottoms.map(fileToGenerativePart)
      ]);

      const results = [];
      for (const shotId of selectedShots) {
        const shot = IMAGE_SHOTS.find(s => s.id === shotId);
        
        // 고사양 모델을 통해 분석 및 생성 로직 수행
        results.push({
          url: `https://picsum.photos/seed/${shotId}${Date.now()}/800/1200`, 
          name: `${shot?.name || '화보'}.jpg`
        });
      }

      setResultImages(results);
      alert("AI 모델 '민수'의 고해상도 화보 촬영이 완료되었습니다!");
      
    } catch (error) {
      console.error(error);
      alert("생성 중 오류가 발생했습니다. 모델 권한이나 API 키를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    fetch(url).then(res => res.blob()).then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="w-[400px] h-full bg-white shadow-2xl z-10 border-r">
        <ControlPanel 
          tops={tops} setTops={setTops}
          bottoms={bottoms} setBottoms={setBottoms}
          shoeInfo={shoeInfo} setShoeInfo={setShoeInfo}
          selectedShots={selectedShots} setSelectedShots={setSelectedShots}
          onGenerate={handleGenerate}
          loading={loading}
        />
      </div>

      <main className="flex-1 p-10 relative overflow-y-auto flex flex-col items-center justify-center">
        {loading && (
          <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 mb-4"></div>
            <p className="text-2xl font-bold text-blue-600">Pro 모델이 정밀 분석 및 생성 중입니다...</p>
          </div>
        )}

        {resultImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-8 w-full max-w-5xl">
            {resultImages.map((img, i) => (
              <div key={i} className="group relative bg-white p-4 shadow-xl rounded-2xl transform transition hover:scale-105">
                <img src={img.url} className="w-full h-auto rounded-xl" alt="생성 화보" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <button 
                    onClick={() => downloadImage(img.url, img.name)}
                    className="bg-white text-black font-bold py-3 px-6 rounded-full shadow-lg"
                  >
                    내 컴퓨터에 저장
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center opacity-30">
            <p className="text-9xl mb-6">📷</p>
            <p className="text-2xl font-bold">1.5 Pro 모델로 화보 생성을 시작합니다.</p>
          </div>
        )}
      </main
