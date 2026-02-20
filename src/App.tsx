import React, { useState, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { GoogleGenerativeAI } from '@google/generative-ai'; // 이 부분이 정확해야 합니다
import { IMAGE_SHOTS } from './constants';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export default function App() {
  const [tops, setTops] = useState<File[]>([]);
  const [bottoms, setBottoms] = useState<File[]>([]);
  const [shoeInfo, setShoeInfo] = useState({ image: null as File | null, text: '' });
  const [selectedShots, setSelectedShots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultImages, setResultImages] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (tops.length === 0 || bottoms.length === 0 || selectedShots.length === 0) {
      alert("상의, 하의 사진을 업로드하고 생성할 샷을 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // 선택된 각 샷에 대해 이미지 생성 로직 (예시 프롬프트 구성)
      const prompts = selectedShots.map(shotId => {
        const shot = IMAGE_SHOTS.find(s => s.id === shotId);
        return `쇼핑몰 모델 '민수'의 화보를 생성해줘. 구도는 ${shot?.name}이고, 얼굴은 반드시 턱선(Jawline)에서 잘라내어 보이지 않게 해줘.`;
      });

      alert("AI 모델 '민수'가 화보를 촬영 중입니다. 잠시만 기다려주세요!");
      // 실제 API 호출 및 결과 처리 로직이 들어가는 자리입니다.
      
    } catch (error) {
      console.error(error);
      alert("이미지 생성 중 오류가 발생했습니다: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <div className="w-[400px] h-full bg-white shadow-xl z-10">
        <ControlPanel 
          tops={tops} setTops={setTops}
          bottoms={bottoms} setBottoms={setBottoms}
          shoeInfo={shoeInfo} setShoeInfo={setShoeInfo}
          selectedShots={selectedShots} setSelectedShots={setSelectedShots}
          onGenerate={handleGenerate}
          loading={loading}
        />
      </div>
      <main className="flex-1 flex flex-col items-center justify-center p-10 overflow-y-auto">
        {resultImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
            {resultImages.map((img, i) => (
              <img key={i} src={img} className="w-full rounded-lg shadow-md" alt="생성된 화보" />
            ))}
          </div>
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-4">📸</div>
            <p className="text-gray-500 text-xl font-medium">여기에 AI 모델 '민수'의 착장 이미지가 나타납니다.</p>
            <p className="text-gray-400 mt-2">왼쪽 패널에서 사진을 업로드하고 화보 생성을 시작하세요.</p>
          </div>
        )}
      </main>
    </div>
  );
}
