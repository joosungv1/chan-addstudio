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

  // 파일을 AI가 읽을 수 있는 형식으로 변환하는 함수
  const fileToGenerativePart = async (file: File) => {
    const base64Promise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64Promise, mimeType: file.type } };
  };

  const handleGenerate = async () => {
    if (tops.length === 0 || bottoms.length === 0 || selectedShots.length === 0) {
      alert("사진을 업로드하고 생성할 샷을 선택해주세요.");
      return;
    }

    setLoading(true);
    setStatusText('AI 모델 민수가 의상을 착용하고 화보를 촬영 중입니다...');
    
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      // 이미지 생성을 위해 imagen-3 또는 최신 모델 설정 (사용 가능한 모델 확인 필요)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const imageParts = await Promise.all([
        ...tops.map(fileToGenerativePart),
        ...bottoms.map(fileToGenerativePart)
      ]);

      // 실제로는 여기서 Imagen API를 호출해야 하지만, 
      // 현재 환경에서 확인 가능한 시뮬레이션 결과와 다운로드 로직을 결합합니다.
      setTimeout(() => {
        const mockResult = selectedShots.map(id => ({
          url: `https://picsum.photos/seed/${id}${Date.now()}/800/1200`, // 임시 이미지 (실제 서비스시 AI 결과 주소로 교체)
          name: `${IMAGE_SHOTS.find(s => s.id === id)?.name || '화보'}.jpg`
        }));
        setResultImages(mockResult);
        setLoading(false);
        alert("화보 촬영이 완료되었습니다! 이미지를 클릭하여 저장하세요.");
      }, 5000);

    } catch (error) {
      alert("오류 발생: " + error);
      setLoading(false);
    }
  };

  // 이미지 다운로드 함수
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

      <main className="flex-1 flex flex-col items-center justify-center p-10 relative overflow-y-auto">
        {loading && (
          <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mb-4"></div>
            <p className="text-xl font-bold text-blue-600">{statusText}</p>
          </div>
        )}

        {resultImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-8 w-full max-w-5xl">
            {resultImages.map((img, i) => (
              <div key={i} className="group relative bg-white p-3 shadow-xl rounded-2xl">
                <img src={img.url} className="w-full h-auto rounded-xl" alt="생성 화보" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <button 
                    onClick={() => downloadImage(img.url, img.name)}
                    className="bg-white text-black font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-transform"
                  >
                    내 컴퓨터에 저장하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center opacity-30">
            <p className="text-8xl mb-6">📸</p>
            <p className="text-2xl font-bold">화보 생성 버튼을 누르면 촬영이 시작됩니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}
