
import React, { useState } from 'react';
import { BrandContext, Language, Tone } from '../types';

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
    apiKey: '',
    businessDescription: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName || !formData.category || !formData.apiKey) {
      alert("Business Name, Category, and API Key are required.");
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
          <p className="text-slate-500 text-base mt-2 font-medium">Help us personalize your content</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Gemini API Key*</label>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded"
              >
                Get Free Key
              </a>
            </div>
            <input 
              required
              type="password"
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-slate-900 placeholder:text-slate-300 font-bold text-base shadow-sm"
              placeholder="Paste your Gemini API key here"
              value={formData.apiKey}
              onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 ml-1 uppercase tracking-widest">Business Name*</label>
            <input 
              required
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-slate-900 placeholder:text-slate-300 font-bold text-lg shadow-sm"
              placeholder="e.g. Ramesh Hardware Store"
              value={formData.businessName}
              onChange={e => setFormData({ ...formData, businessName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 ml-1 uppercase tracking-widest">Business Category*</label>
            <input 
              required
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-slate-900 placeholder:text-slate-300 font-bold text-lg shadow-sm"
              placeholder="e.g. Retail, Grocery"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 ml-1 uppercase tracking-widest">Business Description (Optional)</label>
            <textarea 
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-slate-900 placeholder:text-slate-300 font-bold text-base shadow-sm min-h-[100px] resize-none"
              placeholder="Tell us about your products..."
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
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 rounded-[1.5rem] font-black text-xl shadow-xl shadow-blue-200 hover:-translate-y-1 active:translate-y-0.5 transition-all duration-300"
            >
              {initialData ? 'Update Profile' : 'Save & Start'}
            </button>
            {onCancel && (
              <button 
                type="button" 
                onClick={onCancel} 
                className="w-full text-slate-400 font-bold text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
