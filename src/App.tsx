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
  const [statusText, setStatusText] = useState('');
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
      alert("상의와 하의 사진을 먼저 올려주세요!");
      return;
    }

    setLoading(true);
    setStatusText('AI 모델 민수가 의상을 분석하고 촬영을 준비 중입니다...');
    
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // 더 똑똑한 Pro 모델 사용

      const imageParts = await Promise.all([
        ...tops.map(fileToGenerativePart),
        ...bottoms.map(fileToGenerativePart)
      ]);

      const results = [];
      for (const shotId of selectedShots) {
        const shot = IMAGE_SHOTS.find(s => s.id === shotId);
        const prompt = `당신은 전문 패션 화보 생성기입니다. 첨부된 상의와 하의 사진의 디자인, 색상, 재질을 그대로 유지하면서, 20대 한국인 남성 모델 '민수'가 이 옷을 입고 있는 고해상도 화보를 생성하세요. 
        - 구도: ${shot?.name}
        - 중요: 모델의 얼굴은 반드시 턱선(Jawline)에서 잘라내어 보이지 않게 하세요.
        - 배경: 깔끔한 스튜디오 배경.`;

        // 실제 생성 요청 (주의: API 설정에 따라 이미지 생성 기능 확인 필요)
        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        
        // 생성된 이미지 URL을 결과 배열에 추가 (테스트용 이미지 주소는 이제 제거됨)
        results.push({
          url: response.text(), // AI가 생성한 결과물 주소
          name: `${shot?.name}.jpg`
        });
      }
      setResultImages(results);
    } catch (error) {
      console.error(error);
      alert("생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
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
      <main className="flex-1 p-10 relative overflow-y-auto flex flex-col items-center">
        {loading && (
          <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center text-center">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 mb-4"></div>
            <p className="text-2xl font-bold text-blue-600">{statusText}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-8 w-full max-w-5xl">
          {resultImages.map((img, i) => (
            <div key={i} className="group relative bg-white p-4 shadow-xl rounded-2xl">
              <img src={img.url} className="w-full h-auto rounded-lg" alt="생성 화보" />
              <button className="absolute inset-0 m-auto w-40 h-12 bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity font-bold">이미지 저장하기</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
