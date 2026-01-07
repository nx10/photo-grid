import { useState, useRef, useCallback, useEffect } from 'react';

// ============================================================================
// Utilities
// ============================================================================

function gcd(a, b) {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) [a, b] = [b, a % b];
  return a;
}

function getAspectRatio(width, height) {
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;
  return (w > 50 || h > 50) ? `${(width / height).toFixed(2)}:1` : `${w}:${h}`;
}

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

// ============================================================================
// Components
// ============================================================================

function Slider({ label, value, onChange, min, max, unit = '' }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <label className="text-xs uppercase tracking-widest text-neutral-500">{label}</label>
        <span className="text-sm tabular-nums text-neutral-300 font-mono">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider"
        aria-label={label}
      />
    </div>
  );
}

function DropZone({ image, imageName, onFile }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (file?.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => onFile(img, file.name.replace(/\.[^/.]+$/, ''));
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={handleKeyDown}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      className={`
        relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-neutral-950
        ${isDragging ? 'border-white bg-white/5 scale-[1.01]' : 'border-neutral-800 hover:border-neutral-600'}
        ${image ? 'p-4' : 'p-8'}
      `}
      aria-label={image ? `Change image. Current: ${imageName}` : 'Upload an image'}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files[0])}
        className="hidden"
      />
      {image ? (
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-neutral-900 overflow-hidden shrink-0">
            <img src={image.src} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{imageName}</p>
            <p className="text-xs text-neutral-500">{image.width} × {image.height} · {getAspectRatio(image.width, image.height)}</p>
          </div>
          <svg className="w-4 h-4 text-neutral-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
          </div>
          <p className="text-sm text-neutral-400">Drop image or click to upload</p>
        </div>
      )}
    </div>
  );
}

function Preview({ image, repeatX, repeatY, gap, isStale }) {
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    if (!image) {
      setDataUrl(null);
      return;
    }

    // Render in next frame to not block UI
    const frameId = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const w = image.width * repeatX + gap * (repeatX - 1);
      const h = image.height * repeatY + gap * (repeatY - 1);
      
      canvas.width = w;
      canvas.height = h;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      
      for (let row = 0; row < repeatY; row++) {
        for (let col = 0; col < repeatX; col++) {
          ctx.drawImage(image, col * (image.width + gap), row * (image.height + gap));
        }
      }
      
      setDataUrl(canvas.toDataURL('image/png'));
    });

    return () => cancelAnimationFrame(frameId);
  }, [image, repeatX, repeatY, gap]);

  return (
    <div className="h-full rounded-2xl bg-neutral-900/30 border border-neutral-800/50 overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />
      {dataUrl ? (
        <div className="relative h-full min-h-[400px] flex items-center justify-center p-6 checkerboard">
          {isStale && (
            <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-neutral-500">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Updating
            </div>
          )}
          <img
            src={dataUrl}
            alt="Preview"
            className={`max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl transition-opacity duration-150 ${isStale ? 'opacity-50' : ''}`}
          />
        </div>
      ) : (
        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-neutral-700">
          <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <p className="text-sm">Preview appears here</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main App
// ============================================================================

export default function PhotoGrid() {
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState('grid');
  const [repeatX, setRepeatX] = useState(3);
  const [repeatY, setRepeatY] = useState(3);
  const [gap, setGap] = useState(0);
  const [format, setFormat] = useState('png');
  const [jpgQuality, setJpgQuality] = useState(92);

  // Debounce values for preview rendering (200ms delay)
  const debouncedX = useDebounce(repeatX, 200);
  const debouncedY = useDebounce(repeatY, 200);
  const debouncedGap = useDebounce(gap, 200);
  
  const isStale = debouncedX !== repeatX || debouncedY !== repeatY || debouncedGap !== gap;

  const outputWidth = image ? image.width * repeatX + gap * (repeatX - 1) : 0;
  const outputHeight = image ? image.height * repeatY + gap * (repeatY - 1) : 0;

  const handleDownload = useCallback(() => {
    if (!image) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const w = image.width * repeatX + gap * (repeatX - 1);
    const h = image.height * repeatY + gap * (repeatY - 1);
    
    canvas.width = w;
    canvas.height = h;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    
    for (let row = 0; row < repeatY; row++) {
      for (let col = 0; col < repeatX; col++) {
        ctx.drawImage(image, col * (image.width + gap), row * (image.height + gap));
      }
    }
    
    const link = document.createElement('a');
    link.download = `${imageName}-${repeatX}x${repeatY}.${format}`;
    link.href = canvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png', format === 'jpg' ? jpgQuality / 100 : undefined);
    link.click();
  }, [image, imageName, repeatX, repeatY, gap, format, jpgQuality]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-white selection:text-black font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=DM+Mono&display=swap');
        :root { font-family: 'DM Sans', system-ui, sans-serif; }
        .font-mono { font-family: 'DM Mono', monospace; }
        
        .slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          background: #262626;
          border-radius: 999px;
          cursor: pointer;
          outline: none;
        }
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: transform 0.1s;
        }
        .slider::-webkit-slider-thumb:hover { transform: scale(1.1); }
        .slider::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(0.95); }
        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: white;
          border: none;
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        
        .checkerboard {
          background-color: #0a0a0a;
          background-image:
            linear-gradient(45deg, #171717 25%, transparent 25%),
            linear-gradient(-45deg, #171717 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #171717 75%),
            linear-gradient(-45deg, transparent 75%, #171717 75%);
          background-size: 16px 16px;
          background-position: 0 0, 0 8px, 8px -8px, -8px 0;
        }
        
        .fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } }
      `}</style>

      <div className="max-w-6xl mx-auto p-6 lg:p-10">
        <header className="mb-10 fade-in">
          <h1 className="text-2xl font-medium tracking-tight">Photo Grid</h1>
          <p className="text-neutral-500 text-sm mt-1">Tile and repeat images</p>
        </header>

        <div className="grid lg:grid-cols-[320px,1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-5 fade-in">
            <DropZone 
              image={image} 
              imageName={imageName} 
              onFile={(img, name) => { setImage(img); setImageName(name); }} 
            />

            <div className="space-y-5 p-5 rounded-2xl bg-neutral-900/50 border border-neutral-800/50">
              <Slider label="Columns" value={repeatX} onChange={setRepeatX} min={1} max={12} />
              <Slider label="Rows" value={repeatY} onChange={setRepeatY} min={1} max={12} />
              <Slider label="Gap" value={gap} onChange={setGap} min={0} max={50} unit="px" />

              <div className="pt-3 border-t border-neutral-800/50 space-y-3">
                <span className="text-xs uppercase tracking-widest text-neutral-500">Format</span>
                <div className="flex gap-2">
                  {['png', 'jpg'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`flex-1 py-2 rounded-lg text-xs uppercase tracking-wide font-medium transition-all ${
                        format === f ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                {format === 'jpg' && (
                  <Slider label="Quality" value={jpgQuality} onChange={setJpgQuality} min={10} max={100} unit="%" />
                )}
              </div>
            </div>

            {image && (
              <div className="p-4 rounded-2xl bg-neutral-900/30 border border-neutral-800/30 font-mono text-xs fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-neutral-600">Output</span><p className="text-neutral-300 mt-0.5">{outputWidth} × {outputHeight}</p></div>
                  <div><span className="text-neutral-600">Ratio</span><p className="text-neutral-300 mt-0.5">{getAspectRatio(outputWidth, outputHeight)}</p></div>
                  <div><span className="text-neutral-600">Tiles</span><p className="text-neutral-300 mt-0.5">{repeatX * repeatY}</p></div>
                  <div><span className="text-neutral-600">Scale</span><p className="text-neutral-300 mt-0.5">{((outputWidth * outputHeight) / (image.width * image.height)).toFixed(1)}×</p></div>
                </div>
              </div>
            )}

            <button
              onClick={handleDownload}
              disabled={!image}
              className={`w-full py-3.5 rounded-xl font-medium text-sm transition-all ${
                image ? 'bg-white text-black hover:bg-neutral-200 active:scale-[0.98]' : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
              }`}
            >
              {image ? `Download ${format.toUpperCase()}` : 'Upload an image'}
            </button>
          </aside>

          {/* Preview */}
          <main className="fade-in lg:min-h-[500px]">
            <Preview 
              image={image} 
              repeatX={debouncedX} 
              repeatY={debouncedY} 
              gap={debouncedGap}
              isStale={isStale}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
