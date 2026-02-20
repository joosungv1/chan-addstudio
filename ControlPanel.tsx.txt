import React from 'react';
import { IMAGE_SHOTS, VIDEO_OPTIONS } from '../constants';

export const ControlPanel = ({ 
  tops, setTops, bottoms, setBottoms, shoeInfo, setShoeInfo, 
  selectedShots, setSelectedShots, selectedVideo, setSelectedVideo, 
  isGifSelected, setIsGifSelected, onGenerate, loading 
}: any) => {

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'top' | 'bottom') => {
    const files = Array.from(e.target.files || []);
    if (type === 'top') {
      setTops((prev: File[]) => [...prev, ...files].slice(0, 5));
    } else {
      setBottoms((prev: File[]) => [...prev, ...files].slice(0, 5));
    }
  };

  const removeFile = (index: number, type: 'top' | 'bottom') => {
    if (type === 'top') {
      setTops((prev: File[]) => prev.filter((_, i) => i !== index));
    } else {
      setBottoms((prev: File[]) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="p-6 space-y-8 bg-white h-full overflow-y-auto pb-20 border-r">
      <h1 className="text-xl font-bold text-gray-800 border-b pb-4">AI MD STUDIO</h1>

      <section className="space-y-3">
        <label className="text-sm font-bold text-blue-600">상의 업로드 (최대 5장)</label>
        <div className="flex flex-wrap gap-2">
          {tops.map((file: File, i: number) => (
            <div key={i} className="relative w-20 h-20 border-2 border-gray-200 rounded-md overflow-hidden">
              <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="상의" />
              <button onClick={() => removeFile(i, 'top')} className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 flex items-center justify-center text-xs">×</button>
            </div>
          ))}
          {tops.length < 5 && (
            <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-50">
              <span className="text-xl text-gray-400">+</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'top')} />
            </label>
          )}
        </div>
      </section>

      <section className="space-y-3 border-t pt-4">
        <label className="text-sm font-bold text-green-600">하의 업로드 (최대 5장)</label>
        <div className="flex flex-wrap gap-2">
          {bottoms.map((file: File, i: number) => (
            <div key={i} className="relative w-20 h-20 border-2 border-gray-200 rounded-md overflow-hidden">
              <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="하의" />
              <button onClick={() => removeFile(i, 'bottom')} className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 flex items-center justify-center text-xs">×</button>
            </div>
          ))}
          {bottoms.length < 5 && (
            <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-50">
              <span className="text-xl text-gray-400">+</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'bottom')} />
            </label>
          )}
        </div>
      </section>

      <section className="space-y-3 border-t pt-4">
        <label className="text-sm font-bold text-purple-600">신발 (선택)</label>
        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0">
            {shoeInfo.image ? (
              <div className="relative w-20 h-20 border-2 border-gray-200 rounded-md overflow-hidden">
                <img src={URL.createObjectURL(shoeInfo.image)} className="w-full h-full object-cover" alt="신발" />
                <button onClick={() => setShoeInfo({ ...shoeInfo, image: null })} className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 flex items-center justify-center text-xs">×</button>
              </div>
            ) : (
              <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-50">
                <span className="text-xl text-gray-400">+</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setShoeInfo({ ...shoeInfo, image: file });
                }} />
              </label>
            )}
          </div>
          <div className="flex-1">
            <textarea 
              value={shoeInfo.text}
              onChange={(e) => setShoeInfo({ ...shoeInfo, text: e.target.value })}
              placeholder="신발에 대한 설명 (예: 하얀색 스니커즈)"
              className="w-full h-20 p-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t">
        <p className="text-sm font-bold text-gray-700">작업 선택</p>
        <div className="grid grid-cols-2 gap-2">
          {IMAGE_SHOTS.map((s: any) => (
            <button key={s.id} onClick={() => setSelectedShots((prev: string[]) => prev.includes(s.id) ? prev.filter((x: string) => x !== s.id) : [...prev, s.id])}
              className={`p-2 text-xs border ${selectedShots.includes(s.id) ? 'bg-black text-white' : 'bg-white'}`}>
              {s.name}
            </button>
          ))}
        </div>
      </section>

      <button onClick={onGenerate} disabled={loading} className="w-full py-4 bg-blue-600 text-white font-bold">
        {loading ? "작업 중..." : "AI 화보 생성 시작"}
      </button>
    </div>
  );
};
