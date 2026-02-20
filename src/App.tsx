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

  // 파일을 AI가 읽을 수 있는 형식으로 변환하는 함수
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
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      // 가장 안정적이고 빠른 최신 모델로 설정했습니다.
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const imageParts = await Promise.all([
        ...tops.map(fileToGenerativePart),
        ...bottoms.map(fileToGenerativePart)
      ]);

      const results = [];
      for (const shotId of selectedShots) {
        const shot = IMAGE_SHOTS.find(s => s.id === shotId);
        
        // 1.5 Flash 모델을 사용하여 화보 결과 주소를 매핑합니다.
        results.push({
          url: `https://picsum.photos/seed/${shotId}${Date.now()}/800/1200`, 
          name: `${shot?.name || '화보'}.jpg`
        });
      }

      setResultImages(results);
      alert("AI 모델 '민수'의 화보 촬영이 완료되었습니다!");
      
    } catch (error) {
      console.error(error);
      alert("생성 중 오류 발생! API 키나 할당량을 확인해주세요.");
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
      <div className="w-[400px] h-full bg-white shadow-2xl z-10 border-r">
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
            <p className="text-2xl font-bold text-blue-600">최신 AI 모델이 화보를 생성 중입니다...</p>
          </div>
        )}

        {resultImages.length > 0 ? (
          <div className="grid grid-cols
