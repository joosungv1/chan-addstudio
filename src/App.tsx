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
      alert("상의, 하의 사진을 올리고 촬영할 샷을 선택해주세요!");
      return;
    }

    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // 이미지 생성에 강한 Pro 모델

      const imageParts = await Promise.all([
        ...tops.map(fileToGenerativePart),
        ...bottoms.map(fileToGenerativePart)
      ]);

      const results = [];
      for (const shotId of selectedShots) {
        const shot = IMAGE_SHOTS.find(s => s.id === shotId);
        const prompt = `첨부된 옷 사진을 입은 20대 한국 남성 쇼핑몰 화보를 만들어줘. 
        - 구도: ${shot?.name}. 
        - 얼굴은 반드시 턱선에서 잘라서 보이지 않게 해줘. 
        - 배경은 깨끗한 흰색 스튜디오.`;

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        // AI가 생성한 실제 결과 주소를 가져옵니다.
        results.push({ url: response.text(), name: `${shot?.name}.jpg` });
      }
      setResultImages(results);
    } catch (error) {
      alert("생성 중 오류 발생: " + error);
    } finally {
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
            <p className="text-xl font-bold text-blue-600">AI 모델이 사장님의 옷을 분석 중입니다...</p>
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
