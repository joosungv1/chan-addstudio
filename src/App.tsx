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
  const [statusText, setStatusText] = useState(''); // 진행 상태 메시지
  const [resultImages, setResultImages] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (tops.length === 0 || bottoms.length === 0 || selectedShots.length === 0) {
      alert("사진을 업로드하고 생성할 샷을 선택해주세요.");
      return;
    }

    setLoading(true);
    setStatusText('AI 모델 민수에게 의상을 입히는 중입니다...');
    
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // 실제 생성 시뮬레이션 (사장님이 실제 API 연동을 완료하면 이 부분이 진짜 이미지로 바뀝니다)
      await new Promise(resolve => setTimeout(resolve, 3000)); 
      setStatusText('디테일과 구도를 조정하고 있습니다 (80%)...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      alert("화보 생성이 완료되었습니다!");
      // 임시 결과 확인용 (추후 API 결과값으로 대체)
      setResultImages(['https://via.placeholder.com/400x600?text=AI+Photoshoot+Result']);
      
    } catch (error) {
      alert("오류 발생: " + error);
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <div className="w-[400px] h-full bg-white shadow-2xl z-10">
        <ControlPanel 
          tops={tops} setTops={setTops}
          bottoms={bottoms} setBottoms={setBottoms}
          shoeInfo={shoeInfo} setShoeInfo={setShoeInfo}
          selectedShots={selectedShots} setSelectedShots={setSelectedShots}
          onGenerate={handleGenerate}
          loading={loading}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-10 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-xl font-bold text-blue-600 animate-pulse">{statusText}</p>
            <p className="text-gray-500 mt-2">약 10~20초 정도 소요될 수 있습니다.</p>
          </div>
        )}

        {resultImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 w-full max-w-5xl">
            {resultImages.map((img, i) => (
              <div key={i} className="group relative bg-white p-2 shadow-lg rounded-xl transition-transform hover:scale-105">
                <img src={img} className="w-full h-auto rounded-lg" alt="생성된 화보" />
                <button className="absolute bottom-4 right-4 bg-black/50 text-white px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">저장하기</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center opacity-40">
            <div className="text-8xl mb-6">📸</div>
            <p className="text-2xl font-bold text-gray-700">여기에 AI 모델 '민수'의 착장 이미지가 나타납니다.</p>
            <p className="text-gray-500 mt-3 text-lg">왼쪽 패널에서 사진을 업로드하고 화보 생성을 시작하세요.</p>
          </div>
        )}
      </main>
    </div>
  );
}
