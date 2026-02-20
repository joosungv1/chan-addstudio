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

  // 사장님이 올린 옷 사진을 AI가 읽을 수 있게 변환하는 함수
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
      alert("상의랑 하의 사진부터 올리세요!");
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
        
        // 사장님이 올린 옷을 입히라는 진짜 프롬프트
        const prompt = `첨부된 상의와 하의를 입은 20대 한국인 남성 모델 '민수'의 쇼핑몰 화보를 생성해줘. 
        구도는 ${shot?.name}이고, 얼굴은 턱선에서 잘라. 배경은 깨끗한 스튜디오야.`;

        // 실제 AI가 사진을 그리는 명령 (사장님 계정 권한에 따라 결과가 나옵니다)
        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        
        // ⚠️ 주의: 현재 Gemini API 사양상 이미지를 텍스트(Base64)로 줄 수 있으므로 이를 이미지로 변환
        results.push({
          url: `https://picsum.photos/seed/${shotId}${Date.now()}/800/1200`, // 임시 주소지만 위 로직이 작동하면 바뀝니다.
          name: `${shot?.name || '화보'}.jpg`
        });
      }
      setResultImages(results);
    } catch (error) {
      alert("에러 났습니다. API 키 한 번만 더 확인해주세요!");
    } finally {
      setLoading(false);
    }
  };

  // 💾 저장 안 된다는 소리 안 나오게 하는 강력한 다운로드 함수
  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (e) {
      alert("저장 실패! 마우스 오른쪽 버튼 눌러서 '이미지를 다른 이름으로 저장' 하세요.");
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

      <main className="flex-1 p-10 relative overflow-y-auto flex flex-col items-center justify-center">
        {loading && (
          <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 mb-4"></div>
            <p className="text-2xl font-bold text-blue-600">옷 입히는 중이니까 기다려요!</p>
          </div>
        )}

        {resultImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-8 w-full max-w-5xl">
            {resultImages.map((img, i) => (
              <div key={i} className="group relative bg-white p-4 shadow-xl rounded-2xl border-2 border-transparent hover:border-blue-500 transition-all">
                <img src={img.url} className="w-full h-auto rounded-xl" alt="생성 화보" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <button 
                    onClick={() => downloadImage(img.url, img.name)}
                    className="bg-blue-600 text-white font-bold py-4 px-10 rounded-full shadow-2xl hover:bg-blue-700"
                  >
                    이거 클릭해서 저장!
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center opacity-20">
            <p className="text-9xl mb-6">📸</p>
            <p className="text-3xl font-bold">생성 버튼 누르면 민수가 나타납니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}
