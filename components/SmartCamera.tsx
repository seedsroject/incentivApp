
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface SmartCameraProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
  title?: string;
}

interface Point { x: number; y: number; }

// --- MATH HELPERS (HOMOGRAFIA) ---
const distance = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

function solveGaussian(A: number[][], b: number[]) {
  const n = A.length;
  for (let i = 0; i < n; i++) {
    let maxEl = Math.abs(A[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxEl) {
        maxEl = Math.abs(A[k][i]);
        maxRow = k;
      }
    }
    for (let k = i; k < n; k++) {
      const tmp = A[maxRow][k];
      A[maxRow][k] = A[i][k];
      A[i][k] = tmp;
    }
    const tmp = b[maxRow];
    b[maxRow] = b[i];
    b[i] = tmp;
    for (let k = i + 1; k < n; k++) {
      const c = -A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        if (i === j) {
          A[k][j] = 0;
        } else {
          A[k][j] += c * A[i][j];
        }
      }
      b[k] += c * b[i];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i > -1; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += A[i][j] * x[j];
    }
    x[i] = (b[i] - sum) / A[i][i];
  }
  return x;
}

function calculateHomographyMatrix(u0: number, v0: number, u1: number, v1: number, u2: number, v2: number, u3: number, v3: number, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
  let a: number[][] = [];
  let b: number[] = [];
  const addPoint = (u: number, v: number, x: number, y: number) => {
    a.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
    b.push(x);
    a.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
    b.push(y);
  };
  addPoint(u0, v0, x0, y0);
  addPoint(u1, v1, x1, y1);
  addPoint(u2, v2, x2, y2);
  addPoint(u3, v3, x3, y3);
  const x = solveGaussian(a, b);
  return [x[0], x[1], x[2], x[3], x[4], x[5], x[6], x[7], 1];
}

const processPerspectiveCrop = (
  imageSrc: string,
  corners: Point[],
  originalWidth: number,
  originalHeight: number
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const [tl, tr, br, bl] = corners;
      const widthTop = distance(tl, tr);
      const widthBottom = distance(bl, br);
      const maxWidth = Math.floor(Math.max(widthTop, widthBottom));
      const heightLeft = distance(tl, bl);
      const heightRight = distance(tr, br);
      const maxHeight = Math.floor(Math.max(heightLeft, heightRight));

      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = originalWidth;
      srcCanvas.height = originalHeight;
      const srcCtx = srcCanvas.getContext('2d');
      if (!srcCtx) return resolve(imageSrc);
      srcCtx.drawImage(img, 0, 0);
      const srcData = srcCtx.getImageData(0, 0, originalWidth, originalHeight);

      const dstCanvas = document.createElement('canvas');
      dstCanvas.width = maxWidth;
      dstCanvas.height = maxHeight;
      const dstCtx = dstCanvas.getContext('2d');
      if (!dstCtx) return resolve(imageSrc);
      const dstData = dstCtx.createImageData(maxWidth, maxHeight);

      const hMatrix = calculateHomographyMatrix(
        maxWidth, 0,
        0, 0,
        0, maxHeight,
        maxWidth, maxHeight,
        tr.x, tr.y,
        tl.x, tl.y,
        bl.x, bl.y,
        br.x, br.y
      );

      for (let y = 0; y < maxHeight; y++) {
        for (let x = 0; x < maxWidth; x++) {
          const div = hMatrix[6] * x + hMatrix[7] * y + 1;
          const srcX = (hMatrix[0] * x + hMatrix[1] * y + hMatrix[2]) / div;
          const srcY = (hMatrix[3] * x + hMatrix[4] * y + hMatrix[5]) / div;
          if (srcX >= 0 && srcX < originalWidth && srcY >= 0 && srcY < originalHeight) {
            const srcPixelX = Math.floor(srcX);
            const srcPixelY = Math.floor(srcY);
            const srcIdx = (srcPixelY * originalWidth + srcPixelX) * 4;
            const dstIdx = (y * maxWidth + x) * 4;
            dstData.data[dstIdx] = srcData.data[srcIdx];
            dstData.data[dstIdx + 1] = srcData.data[srcIdx + 1];
            dstData.data[dstIdx + 2] = srcData.data[srcIdx + 2];
            dstData.data[dstIdx + 3] = 255;
          }
        }
      }
      dstCtx.putImageData(dstData, 0, 0);
      resolve(dstCanvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = imageSrc;
  });
};

// --- COMPONENTE INTERNO: CROPPER ---
const PerspectiveCropper: React.FC<{
  imageSrc: string;
  onConfirm: (croppedImage: string) => void;
  onRetake: () => void;
}> = ({ imageSrc, onConfirm, onRetake }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgDimensions, setImgDimensions] = useState({ w: 0, h: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>([{ x: 20, y: 20 }, { x: 80, y: 20 }, { x: 80, y: 80 }, { x: 20, y: 80 }]);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setImgDimensions({ w: img.width, h: img.height });
    };
  }, [imageSrc]);

  const handleDragStart = (index: number) => (e: React.MouseEvent | React.TouchEvent) => {
    if (previewUrl) return;
    e.preventDefault();
    setActivePointIndex(index);
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (activePointIndex === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;
    x = Math.max(-5, Math.min(105, x));
    y = Math.max(-5, Math.min(105, y));
    setPoints(prev => {
      const newPoints = [...prev];
      newPoints[activePointIndex] = { x, y };
      return newPoints;
    });
  }, [activePointIndex]);

  const handleDragEnd = useCallback(() => {
    setActivePointIndex(null);
  }, []);

  useEffect(() => {
    if (activePointIndex !== null) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [activePointIndex, handleDragMove, handleDragEnd]);

  const generatePreview = async () => {
    if (imgDimensions.w === 0) return;
    setIsProcessing(true);
    const pixelPoints = points.map(p => ({
      x: (Math.max(0, Math.min(100, p.x)) / 100) * imgDimensions.w,
      y: (Math.max(0, Math.min(100, p.y)) / 100) * imgDimensions.h
    }));
    setTimeout(async () => {
      const rectified = await processPerspectiveCrop(imageSrc, pixelPoints, imgDimensions.w, imgDimensions.h);
      setPreviewUrl(rectified);
      setIsProcessing(false);
    }, 100);
  };

  const getPolygonPath = () => `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const getGridLines = () => {
    const lines = [];
    const [p0, p1, p2, p3] = points;
    for (let i = 1; i <= 2; i++) {
      const t = i / 3;
      const topX = lerp(p0.x, p1.x, t); const topY = lerp(p0.y, p1.y, t);
      const botX = lerp(p3.x, p2.x, t); const botY = lerp(p3.y, p2.y, t);
      lines.push(`M ${topX} ${topY} L ${botX} ${botY}`);
    }
    for (let i = 1; i <= 2; i++) {
      const t = i / 3;
      const leftX = lerp(p0.x, p3.x, t); const leftY = lerp(p0.y, p3.y, t);
      const rightX = lerp(p1.x, p2.x, t); const rightY = lerp(p1.y, p2.y, t);
      lines.push(`M ${leftX} ${leftY} L ${rightX} ${rightY}`);
    }
    return lines.join(" ");
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="p-4 bg-black text-white flex justify-between items-center border-b border-gray-800">
        <h3 className="font-bold text-lg">{previewUrl ? 'Pré-visualização' : 'Ajustar Perspectiva'}</h3>
        <button onClick={onRetake} className="text-sm text-gray-300 hover:text-white px-2">Cancelar</button>
      </div>
      <div className="flex-1 bg-gray-900 relative overflow-hidden flex items-center justify-center p-4">
        {previewUrl ? (
          <div className="relative w-full max-w-lg h-full flex items-center justify-center">
            <img src={previewUrl} alt="Retificado" className="max-w-full max-h-full object-contain shadow-2xl border-2 border-white/20" />
          </div>
        ) : (
          <div ref={containerRef} className="relative w-full max-w-lg aspect-[3/4] max-h-[80vh]">
            <img src={imageSrc} alt="Original" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none opacity-80" />
            <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <mask id="hole">
                  <rect width="100%" height="100%" fill="white" />
                  <path d={getPolygonPath()} fill="black" />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#hole)" />
              <path d={getPolygonPath()} fill="none" stroke="#3B82F6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <path d={getGridLines()} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="2,2" />
            </svg>
            {points.map((p, idx) => (
              <div key={idx} onMouseDown={handleDragStart(idx)} onTouchStart={handleDragStart(idx)} className="absolute w-12 h-12 -ml-6 -mt-6 flex items-center justify-center cursor-move z-10 touch-none group" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <div className={`w-6 h-6 rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-transform ${activePointIndex === idx ? 'bg-blue-500 scale-125' : 'bg-blue-600 group-hover:scale-110'}`}>
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        )}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-3"></div>
            <p className="text-white font-bold">Processando...</p>
          </div>
        )}
      </div>
      <div className="p-6 bg-black flex gap-4 border-t border-gray-800">
        {!previewUrl ? (
          <>
            <button onClick={onRetake} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-lg font-bold hover:bg-gray-700">Tirar Outra</button>
            <button onClick={generatePreview} className="flex-[2] py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-500 flex items-center justify-center gap-2">Pré-visualizar</button>
          </>
        ) : (
          <>
            <button onClick={() => setPreviewUrl(null)} className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600">Ajustar</button>
            <button onClick={() => onConfirm(previewUrl!)} className="flex-[2] py-3 bg-green-600 text-white rounded-lg font-bold shadow-lg hover:bg-green-500 flex items-center justify-center gap-2">Confirmar</button>
          </>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTE EXPORTADO: SMART CAMERA ---
export const SmartCamera: React.FC<SmartCameraProps> = ({ onCapture, onClose, title = "Câmera Inteligente" }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [rawImage, setRawImage] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
      return () => { isMounted.current = false; };
  }, []);

  const getDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      if (isMounted.current) {
        setVideoDevices(videoInputs);
      }
      return videoInputs;
    } catch (error) {
      console.error("Erro ao listar dispositivos", error);
      return [];
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
          track.stop();
          // Garante que o track esteja parado
          track.enabled = false;
      });
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async (targetDeviceId?: string) => {
    stopCamera();
    
    // Pequeno delay para garantir que a câmera anterior foi liberada
    await new Promise(r => setTimeout(r, 100));
    if (!isMounted.current) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Câmera não suportada neste navegador.");
        onClose();
        return;
    }

    let stream: MediaStream | null = null;
    let usedDeviceId = targetDeviceId;

    try {
        // TENTATIVA 1: Device ID Específico (se fornecido)
        if (targetDeviceId) {
            try {
                console.log(`Tentando câmera específica: ${targetDeviceId}`);
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { deviceId: { exact: targetDeviceId } } 
                });
            } catch (err) {
                console.warn(`Falha ao acessar câmera específica (${targetDeviceId}). Tentando fallback...`);
                // Se falhar, limpa o ID alvo para cair no próximo bloco
                usedDeviceId = undefined;
            }
        }

        // TENTATIVA 2: Câmera Traseira (Environment)
        if (!stream && !usedDeviceId) {
            try {
                console.log("Tentando câmera traseira (environment)...");
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } 
                });
            } catch (err) {
                console.warn("Falha ao acessar câmera traseira. Tentando qualquer câmera...");
            }
        }

        // TENTATIVA 3: Qualquer Câmera (Genérico)
        if (!stream) {
            console.log("Tentando câmera genérica...");
            // Esta chamada lança erro se NENHUMA câmera for encontrada
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        // SUCESSO
        if (stream && isMounted.current && videoRef.current) {
            videoRef.current.srcObject = stream;
            
            // Tenta reproduzir (necessário em alguns browsers)
            try {
                await videoRef.current.play();
            } catch (e) {
                console.warn("Erro ao iniciar reprodução do vídeo:", e);
            }

            // Atualiza lista de dispositivos
            const devices = await getDevices();
            
            // Descobre qual câmera foi realmente selecionada
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();
            const activeDeviceId = settings.deviceId;

            if (activeDeviceId && isMounted.current) {
                setSelectedDeviceId(activeDeviceId);
            }
        } else if (stream) {
            // Se montou mas desmontou no processo
            stream.getTracks().forEach(t => t.stop());
        }

    } catch (err: any) {
        console.error("Erro fatal ao acessar camera:", err);
        let errorMessage = "Não foi possível acessar a câmera.";
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errorMessage = "Permissão de acesso à câmera negada. Verifique as configurações do navegador.";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            errorMessage = "Nenhuma câmera encontrada no dispositivo.";
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            errorMessage = "A câmera pode estar em uso por outro aplicativo.";
        } else if (err.name === 'OverconstrainedError') {
            errorMessage = "A câmera solicitada não está disponível (Resolução ou ID inválido).";
        }
        
        alert(errorMessage);
        onClose();
    }
  };

  useEffect(() => {
    // Inicialização
    startCamera();
    return () => {
        stopCamera();
    };
  }, []);

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDeviceId = e.target.value;
    setSelectedDeviceId(newDeviceId);
    // Reinicia com o novo ID
    startCamera(newDeviceId);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      const width = video.videoWidth;
      const height = video.videoHeight;
      
      if (width && height) {
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');
          if (context) {
            context.drawImage(video, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
            setRawImage(dataUrl);
            stopCamera();
          }
      }
    }
  };

  if (rawImage) {
    return (
      <PerspectiveCropper
        imageSrc={rawImage}
        onConfirm={onCapture}
        onRetake={() => {
          setRawImage(null);
          startCamera(selectedDeviceId); // Tenta reabrir a última câmera usada
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start bg-gradient-to-b from-black/70 to-transparent">
        <button onClick={onClose} className="text-white bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-md transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>
        {videoDevices.length > 0 && (
          <div className="flex-1 max-w-xs mx-4">
            <select
              value={selectedDeviceId}
              onChange={handleDeviceChange}
              className="w-full bg-black/50 text-white border border-white/30 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500 backdrop-blur-md"
            >
              {videoDevices.map((device, idx) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Câmera ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="w-10"></div>
      </div>
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute inset-0 border-2 border-white/30 m-8 rounded-lg pointer-events-none flex items-center justify-center">
          <p className="bg-black/60 text-white px-3 py-1 rounded text-sm backdrop-blur-sm shadow-sm">{title}</p>
        </div>
      </div>
      <div className="bg-black p-8 flex justify-center pb-12">
        <button onClick={capturePhoto} className="h-20 w-20 bg-white rounded-full border-4 border-blue-500 shadow-lg active:scale-95 transition-transform" aria-label="Tirar Foto" />
      </div>
    </div>
  );
};
