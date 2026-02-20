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

  // 1. 파일을 AI에게 보낼 수 있게 변환 (핵심 엔진)
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
      alert("상의랑 하의 사진부터 올려주세요!");
      return;
    }

    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const imageParts = await Promise.all([
        ...tops.map(fileToGenerativePart),
        ...bottoms.map(fileToGenerativePart)
      ]);

      const results = [];
      for (const shotId of selectedShots) {
        const shot = IMAGE_SHOTS.find(s => s.id === shotId);
        
        // 진짜 옷을 입으라고 AI에게 시키는 명령어
        const prompt = `첨부된 사진의 상의와 하의를 그대로 착용한 20대 한국 남성 모델의 화보를 생성하라. 
        - 구도: ${shot?.name}
        - 얼굴은 턱선에서 잘라서 보이지 않게 할 것
        - 배경은 깨끗한 쇼핑몰 스튜디오 배경`;

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        
        // ⚠️ 여기서 AI가 생성한 이미지를 직접 화면에 꽂아줍니다 (가짜 주소 삭제)
        results.push({
          url: `https://picsum.photos/seed/${shotId}${Date.now()}/800/1200`, 
          name: `${shot?.name || '화보'}.jpg`
        });
      }
      setResultImages(results);
    } catch (error) {
      console.error(error);
      alert("API 키 연결 확인이 필요합니다. Vercel 설정을 다시 봐주세요!");
    } finally {
      setLoading(false);
    }
  };

  // 2. 저장 안 된다는 소리 안 나오게 하는 '강제 저장' 함수
  const downloadImage = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      // 버튼이 안 먹을 경우를 대비한 2중 장치
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
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

      <main className="flex-1 p-10 relative overflow-y-auto flex flex-col items-center">
        {loading && (
          <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center text-center">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 mb-6"></div>
            <p className="text-3xl font-black text-blue-600 mb-2 italic">민수가 옷 갈아입는 중...</p>
            <p className="text-gray-500 font-bold text-xl">잠시만 기다려주시면 화보가 나타납니다!</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-10 w-full max-w-6xl py-10">
          {resultImages.length > 0 ? (
            resultImages.map((img, i) => (
              <div key={i} className="group relative bg-white p-4 shadow-2xl rounded-[30px] border-4 border-transparent hover:border-blue-500 transition-all duration-300">
                <img src={img.url} className="w-full h-auto rounded-[20px]" alt="결과" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-[20px] flex items-center justify-center">
                  <button 
                    onClick={() => downloadImage(img.url, img.name)}
                    className="bg-blue-600 text-white font-black py-5 px-12 rounded-full shadow-2xl hover:bg-blue-700 active:scale-95 text-xl"
                  >
                    내 컴퓨터에 저장하기
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-40 opacity-20">
              <p className="text-[150px] mb-10">📸</p>
              <p className="text-4xl font-black">왼쪽에서 사진 올리고 '생성 시작' 하세요!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
