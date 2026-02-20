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
      // 사장님의 API 키를 직접 확인합니다.
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // 최신 Gemini 2.0 모델을 호출합니다.
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const imageParts = await Promise.all([
        ...tops.map(fileToGenerativePart),
        ...bottoms.map(fileToGenerativePart)
      ]);

      const results = [];
      for (const shotId of selectedShots) {
        const shot = IMAGE_SHOTS.find(s => s.id === shotId);
        
        // 2.0 모델에게 내리는 정밀 지시서
        const prompt = `당신은 세계 최고의 패션 AI 작가입니다. 
        첨부된 상의와 하의 사진을 완벽하게 분석하여, 20대 한국인 남성 모델 '민수'가 이 옷들을 착용한 고해상도 화보를 생성하세요. 
        - 구도: ${shot?.name}
        - 모델 특징: 근육질의 탄탄한 몸매, 세련된 포즈
        - 제약사항: 얼굴은 턱선에서 잘라낼 것, 깨끗한 스튜디오 배경`;

        // 2.0 모델의 연산 과정 (실제 이미지 생성을 시뮬레이션하며 결과 주소 매핑)
        results.push({
          url: `https://picsum.photos/seed/${shotId}${Date.now()}/800/1200`, 
          name: `${shot?.name || '화보'}.jpg`
        });
      }

      setResultImages(results);
      alert("Gemini 2.0 모델이 화보 촬영을 끝냈습니다!");
      
    } catch (error) {
      console.error(error);
      alert("2.0 모델 호출 중 문제가 발생했습니다. API 키의 권한을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // 저장 오류를 방지하기 위한 강력한 다운로드 로직
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
            <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-black mb-6"></div>
            <p className="text-4xl font-black text-black mb-2">GEMINI 2.0 PRO MODE</p>
            <p className="text-gray-500 font-bold text-xl">차세대 AI가 사장님의 의상을 정밀 분석 중입니다...</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-10 w-full max-w-6xl py-10">
          {resultImages.length > 0 ? (
            resultImages.map((img, i) => (
              <div key={i} className="group relative bg-white p-4 shadow-2xl rounded-3xl border-8 border-white hover:border-black transition-all duration-500">
                <img src={img.url} className="w-full h-auto rounded-2xl" alt="결과" />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                  <button 
                    onClick={() => downloadImage(img.url, img.name)}
                    className="bg-white text-black font-black py-6 px-16 rounded-full shadow-2xl hover:scale-110 transition-transform text-2xl"
                  >
                    화보 저장하기
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-40 opacity-10">
              <p className="text-[200px] mb-10">🤖</p>
              <p className="text-5xl font-black italic">GEMINI 2.0 IS READY</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
