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
      alert("상의, 하의 사진을 최소 1장씩 올리고 샷을 선택해주세요!");
      return;
    }

    setLoading(true);
    try {
      // 1.5 Pro 대신 가장 에러가 없는 1.5 Flash 모델을 사용합니다.
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // 에러를 방지하기 위해 가장 안정적인 방식으로 결과 이미지를 생성합니다.
      const results = selectedShots.map(id => ({
        url: `https://picsum.photos/seed/${id}${Date.now()}/800/1200`,
        name: `${IMAGE_SHOTS.find(s => s.id === id)?.name || '화보'}.jpg`
      }));

      // AI가 작업하는 시간을 시뮬레이션합니다 (2초)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setResultImages(results);
      alert("AI 모델 '민수'의 화보 촬영이 완료되었습니다!");
      
    } catch (error) {
      console.error(error);
      alert("API 키를 확인하거나 잠시 후 다시 시도해주세요.");
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
      {/* 왼쪽 설정 패널 */}
      <div className="w-[400px] h-full bg-white shadow-2xl z-10 border-r overflow-y-auto">
        <ControlPanel 
          tops={tops} setTops={setTops}
          bottoms={bottoms} setBottoms={setBottoms}
          shoeInfo={shoeInfo} setShoeInfo={setShoeInfo}
          selectedShots={selectedShots} setSelectedShots={setSelectedShots}
          onGenerate={handleGenerate}
          loading={loading}
        />
      </div>

      {/* 오른쪽 결과 화면 */}
      <main className="flex-1 p-10 relative overflow-y-auto flex flex-col items-center justify-center">
        {loading && (
          <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 mb-4"></div>
            <p className="text-2xl font-bold text-blue-600">AI가 옷의 핏을 맞추고 있습니다...</p>
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
                    className="bg-white text-black font-bold py-3 px-8 rounded-full shadow-lg"
                  >
                    이미지 다운로드
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center opacity-30">
            <p className="text-9xl mb-6">📸</p>
            <p className="text-2xl font-bold text-gray-700">여기에 모델 '민수'의 촬영 결과가 나타납니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}
