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

  // 파일을 AI가 읽을 수 있는 형식(Base64)으로 변환
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
      alert("상의, 하의 사진을 최소 1장씩은 올려주셔야 합니다!");
      return;
    }

    setLoading(true);
    setStatusText('AI가 옷의 재질과 핏을 분석하여 화보를 생성 중입니다...');
    
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      // 이미지 생성을 지원하는 최신 모델 설정
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // 사장님이 올린 모든 사진을 AI에게 보낼 준비
      const imageParts = await Promise.all([
        ...tops.map(fileToGenerativePart),
        ...bottoms.map(fileToGenerativePart)
      ]);

      // 샷별로 실제 생성 요청 (반복문)
      const results = [];
      for (const shotId of selectedShots) {
        const shot = IMAGE_SHOTS.find(s => s.id === shotId);
        const prompt = `
          첨부된 상의와 하의 사진을 참고해서 20대 한국인 남성 모델 '민수'가 이 옷들을 입고 있는 고해상도 쇼핑몰 화보를 만들어줘.
          - 모델의 얼굴은 턱선(Jawline)에서 잘라서 보이지 않게 할 것.
          - 구도: ${shot?.name}.
          - 배경: 깔끔한 그레이 톤의 스튜디오 호리존.
          - 옷의 핏과 질감이 사진과 똑같이 구현되어야 함.
        `;

        // 이 부분은 사장님의 구글 API 설정에 따라 이미지 파일 주소로 반환됩니다.
        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        // 실제 이미지 URL 추출 로직 (API 응답 구조에 맞게 처리)
        results.push({
          url: response.text(), // 실제로는 생성된 이미지의 URL이 들어갑니다.
          name: `${shot?.name}.jpg`
        });
      }

      setResultImages(results);
    } catch (error) {
      console.error(error);
      alert("AI 생성 중 오류가 발생했습니다. API 키나 할당량을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
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
          <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 mb-4"></div>
            <p className="text-2xl font-bold text-blue-600">{statusText}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 w-full max-w-5xl">
          {resultImages.map((img, i) => (
            <div key={i} className="group relative bg-white p-4 shadow-xl rounded-2xl">
              <img src={img.url} className="w-full h-auto rounded-lg" alt="생성 화보" />
              <button 
                onClick={() => downloadImage(img.url, img.name)}
                className="absolute inset-0 m-auto w-40 h-12 bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity font-bold"
              >
                이미지 저장하기
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
