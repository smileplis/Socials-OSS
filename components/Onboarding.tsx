
import React, { useState } from 'react';
import { BrandContext } from '../types';

interface Props {
  onSave: (brand: BrandContext) => void;
  initialData?: BrandContext;
  onCancel?: () => void;
}

const Onboarding: React.FC<Props> = ({ onSave, initialData, onCancel }) => {
  const [formData, setFormData] = useState<BrandContext>(initialData || {
    businessName: '',
    category: '',
    city: '',
    language: 'English',
    tone: 'Friendly',
    businessDescription: '',
    apiKey: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName || !formData.category || !formData.city || !formData.apiKey) {
      alert("Please fill in all required fields, including the API Key.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 py-12">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 p-8 sm:p-10 border border-white animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black mx-auto mb-6 shadow-xl shadow-blue-200">
            M
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Business Profile</h2>
          <p className="text-slate-500 text-base mt-2 font-medium">Use your own Gemini API tokens</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 ml-1 uppercase tracking-widest">Gemini API Key*</label>
            <input 
              required
              type="password"
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 outline-none focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-300 font-bold"
              placeholder="Paste your key here..."
              value={formData.apiKey}
              onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
            />
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 font-bold underline ml-1">Get a free key from Google AI Studio</a>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 ml-1 uppercase tracking-widest">Business Name*</label>
            <input 
              required
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 outline-none focus:border-blue-500 transition-all text-slate-900 font-bold"
              placeholder="e.g. Ramesh Hardware Store"
              value={formData.businessName}
              onChange={e => setFormData({ ...formData, businessName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 ml-1 uppercase tracking-widest">Category*</label>
              <input 
                required
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 outline-none focus:border-blue-500 transition-all text-slate-900 font-bold text-sm"
                placeholder="Retail"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 ml-1 uppercase tracking-widest">City*</label>
              <input 
                required
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 outline-none focus:border-blue-500 transition-all text-slate-900 font-bold text-sm"
                placeholder="Pune"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 ml-1 uppercase tracking-widest">Description</label>
            <textarea 
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 outline-none focus:border-blue-500 transition-all text-slate-900 font-bold text-sm min-h-[80px] resize-none"
              placeholder="What do you sell?"
              value={formData.businessDescription}
              onChange={e => setFormData({ ...formData, businessDescription: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 ml-1 uppercase tracking-widest">Language</label>
              <select 
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 font-bold text-sm"
                value={formData.language}
                onChange={e => setFormData({ ...formData, language: e.target.value as any })}
              >
                <option value="English">English</option>
                <option value="Hinglish">Hinglish</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 ml-1 uppercase tracking-widest">Tone</label>
              <select 
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 font-bold text-sm"
                value={formData.tone}
                onChange={e => setFormData({ ...formData, tone: e.target.value as any })}
              >
                <option value="Friendly">Friendly</option>
                <option value="Professional">Professional</option>
                <option value="Local">Local</option>
              </select>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-[1.5rem] font-black text-lg shadow-xl hover:-translate-y-1 transition-all"
            >
              {initialData ? 'Update Profile' : 'Save & Start'}
            </button>
            {onCancel && (
              <button 
                type="button" 
                onClick={onCancel} 
                className="w-full text-slate-400 font-bold text-xs uppercase tracking-widest"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
