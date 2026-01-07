import React, { useState, useRef } from 'react';
import { Wand2, ImagePlus, X, AlertCircle, Loader2, Sparkles, Download, Maximize2, Palette, Ratio } from 'lucide-react';
import { generateCreativePrompt, generateImageFromPrompt } from './services/geminiService';
import { PromptDisplay } from './components/PromptDisplay';
import { LoadingState } from './types';

// Constants for selections
const IMAGE_STYLES = [
  "Cinematic Realism", 
  "Anime / Manga", 
  "Cyberpunk", 
  "Digital Art", 
  "Oil Painting", 
  "3D Render", 
  "Minimalist", 
  "Vintage Photography"
];

const ASPECT_RATIOS = [
  { label: "16:9", value: "16:9", desc: "Landscape" },
  { label: "1:1", value: "1:1", desc: "Square" },
  { label: "9:16", value: "9:16", desc: "Portrait" },
  { label: "4:3", value: "4:3", desc: "Standard" },
  { label: "3:4", value: "3:4", desc: "Tall" }
];

const App: React.FC = () => {
  const [concept, setConcept] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  
  // New State for options
  const [selectedStyle, setSelectedStyle] = useState<string>(IMAGE_STYLES[0]);
  const [selectedRatio, setSelectedRatio] = useState<string>("16:9");

  // Prompt Generation State
  const [promptStatus, setPromptStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  
  // Image Generation State
  const [imageStatus, setImageStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Image size too large. Please upload an image under 5MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Extract base64 and mime type
        const base64Data = result.split(',')[1];
        const mimeType = result.split(',')[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        
        setSelectedImage(base64Data);
        setImageMimeType(mimeType);
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImageMimeType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) return;

    setPromptStatus(LoadingState.LOADING);
    setGeneratedPrompt('');
    setGeneratedImages([]); // Reset images when new prompt is generated
    setImageStatus(LoadingState.IDLE);
    setErrorMsg('');

    try {
      const result = await generateCreativePrompt({
        userConcept: concept,
        imageBase64: selectedImage || undefined,
        imageMimeType: imageMimeType || undefined,
        style: selectedStyle,
        aspectRatio: selectedRatio
      });
      setGeneratedPrompt(result);
      setPromptStatus(LoadingState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setPromptStatus(LoadingState.ERROR);
      setErrorMsg(err.message || "Something went wrong generating the prompt.");
    }
  };

  const handleGenerateImage = async () => {
    if (!generatedPrompt) return;
    
    setImageStatus(LoadingState.LOADING);
    setGeneratedImages([]);
    setErrorMsg('');
    
    try {
      // Pass the generated prompt, reference image, and selected aspect ratio
      const images = await generateImageFromPrompt(
        generatedPrompt, 
        selectedImage || undefined, 
        imageMimeType || undefined,
        selectedRatio
      );
      setGeneratedImages(images);
      setImageStatus(LoadingState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setImageStatus(LoadingState.ERROR);
      setErrorMsg(err.message || "Failed to generate images from prompt.");
    }
  };

  const downloadImage = (base64Data: string, index: number) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64Data}`;
    link.download = `generated-visual-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500 selection:text-white pb-20">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12 md:py-20">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 mb-6 bg-slate-900/50 border border-slate-700/50 rounded-2xl shadow-xl backdrop-blur-sm">
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 mb-4">
            Prompt Architect AI
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Transform raw concepts into award-winning, cinematic image generation prompts using professional creative direction.
          </p>
        </header>

        {/* Main Interface */}
        <main className="grid gap-8">
          {/* Input Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Image Uploader */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  Reference Image <span className="text-slate-500 normal-case font-normal">(Optional)</span>
                </label>
                
                {!selectedImage ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative h-32 w-full border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-800/50 transition-all duration-300"
                  >
                    <ImagePlus className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 mb-2 transition-colors" />
                    <span className="text-sm text-slate-400 group-hover:text-slate-300">Click to upload reference (PNG/JPG)</span>
                  </div>
                ) : (
                  <div className="relative inline-block border border-indigo-500/30 rounded-xl overflow-hidden group">
                    <img 
                      src={`data:${imageMimeType};base64,${selectedImage}`} 
                      alt="Reference" 
                      className="h-48 w-auto object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={clearImage}
                        className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full backdrop-blur-sm transition-transform hover:scale-110"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white backdrop-blur-md">
                      Ref Image
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/png, image/jpeg, image/webp" 
                  className="hidden" 
                />
              </div>

              {/* Style & Ratio Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual Style Selector */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    <Palette size={16} /> Visual Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {IMAGE_STYLES.map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setSelectedStyle(style)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 ${
                          selectedStyle === style
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/20'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio Selector */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    <Ratio size={16} /> Aspect Ratio
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.value}
                        type="button"
                        onClick={() => setSelectedRatio(ratio.value)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200 ${
                          selectedRatio === ratio.value
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/20'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                        }`}
                      >
                        <span className="font-bold text-sm">{ratio.label}</span>
                        <span className="text-[10px] opacity-70">{ratio.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Text Area */}
              <div className="space-y-3">
                <label htmlFor="concept" className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  Concept Description
                </label>
                <textarea
                  id="concept"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Describe your idea (e.g., A futuristic samurai in neon Tokyo rain...)"
                  className="w-full h-32 bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-base"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={promptStatus === LoadingState.LOADING || !concept.trim()}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 transform hover:-translate-y-1 ${
                  promptStatus === LoadingState.LOADING || !concept.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed hover:transform-none'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-900/20'
                }`}
              >
                {promptStatus === LoadingState.LOADING ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Constructing Prompt...
                  </>
                ) : (
                  <>
                    <Wand2 />
                    Generate Professional Prompt
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Error Message */}
          {(promptStatus === LoadingState.ERROR || imageStatus === LoadingState.ERROR) && (
            <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-xl text-red-200 flex items-center gap-3 animate-fade-in">
              <AlertCircle className="shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Prompt Result Display */}
          {promptStatus === LoadingState.SUCCESS && generatedPrompt && (
            <PromptDisplay 
              promptText={generatedPrompt} 
              onGenerateImage={handleGenerateImage}
              isGeneratingImage={imageStatus === LoadingState.LOADING}
            />
          )}

          {/* Generated Images Grid */}
          {generatedImages.length > 0 && (
             <div className="w-full animate-fade-in mt-8">
                <div className="flex items-center gap-2 text-indigo-400 mb-4">
                    <Sparkles size={18} />
                    <h3 className="font-semibold tracking-wide text-sm uppercase">Generated Visuals (4 Variations)</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {generatedImages.map((base64Img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900/50">
                        <img 
                            src={`data:image/png;base64,${base64Img}`} 
                            alt={`Generated Visual ${idx + 1}`}
                            className="w-full h-auto object-cover"
                        />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6 gap-3">
                            <button 
                                onClick={() => setPreviewImage(base64Img)}
                                className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white rounded-full transition-all hover:scale-110"
                                title="Preview"
                            >
                                <Maximize2 size={18} />
                            </button>
                            <button 
                                onClick={() => downloadImage(base64Img, idx)}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full font-semibold transition-all hover:scale-105 text-sm"
                            >
                                <Download size={16} />
                                Download
                            </button>
                        </div>
                        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono text-white/70 border border-white/10">
                          #{idx + 1}
                        </div>
                    </div>
                  ))}
                </div>
             </div>
          )}
        </main>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in"
            onClick={() => setPreviewImage(null)}
        >
            <button 
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
            >
                <X size={32} />
            </button>
            <img 
                src={`data:image/png;base64,${previewImage}`} 
                alt="Full Preview" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
      )}
    </div>
  );
};

export default App;