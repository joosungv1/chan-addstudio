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

  const handleGenerate = async () => {
    if (tops.length === 0 || bottoms.length === 0 || selectedShots.length === 0) {
      alert("상의, 하의 사진을 올리고 촬영할 샷을 선택해주세요!");
      return;
    }

    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // 임시 결과 확인 (나중에 실제 AI 이미지로 연결)
      setTimeout(() => {
        const mockResult = selectedShots.map(id => ({
          url: `https://picsum.photos/seed/${id}${Date.now()}/800/1200`,
          name: `${IMAGE_SHOTS.find(s => s.id === id)?.name}.jpg`
        }));
        setResultImages(mockResult);
        setLoading(false);
      }, 3000);

    } catch (error) {
      alert("오류 발생: " + error);
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-[400px] bg-white shadow-2xl z-10">
        <ControlPanel 
          tops={tops} setTops={setTops}
          bottoms={bottoms} setBottoms={setBottoms}
          shoeInfo={shoeInfo} setShoeInfo={setShoeInfo}
          selectedShots={selectedShots} setSelectedShots={setSelectedShots}
          onGenerate={handleGenerate}
          loading={loading}
        />
      </div>
      <main className="flex-1 p-10 relative overflow-y-auto flex flex-col items-center">
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mb-4"></div>
            <p className="text-xl font-bold text-blue-600">AI 모델이 옷을 갈아입고 있습니다...</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-8 w-full max-w-5xl">
          {resultImages.map((img, i) => (
            <div key={i} className="group relative bg-white p-3 shadow-xl rounded-2xl">
              <img src={img.url} className="w-full h-auto rounded-xl" alt="생성 화보" />
              <button className="absolute inset-0 m-auto w-32 h-12 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">저장하기</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
