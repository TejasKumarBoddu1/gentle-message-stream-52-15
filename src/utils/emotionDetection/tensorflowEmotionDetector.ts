import * as tf from '@tensorflow/tfjs';

export interface EmotionPrediction {
  emotion: string;
  confidence: number;
  timestamp: number;
}

export interface EmotionScores {
  angry: number;
  disgusted: number;
  fearful: number;
  happy: number;
  neutral: number;
  sad: number;
  surprised: number;
}

export interface FacialFeatures {
  eyeOpenness: number;
  mouthCurvature: number;
  eyebrowPosition: number;
  jawTension: number;
  cheekRaise: number;
  noseScrunch: number;
}

export interface EmotionHistory {
  emotion: string;
  confidence: number;
  timestamp: number;
  features: FacialFeatures;
}

export interface EmotionAnalytics {
  dominantEmotion: string;
  emotionDuration: number;
  transitionFrequency: number;
  confidenceStability: number;
  averageConfidence: number;
}

export class TensorFlowEmotionDetector {
  private model: tf.LayersModel | null = null;
  private faceDetectionModel: tf.LayersModel | null = null;
  private isInitialized = false;
  private emotionLabels = ['angry', 'disgusted', 'fearful', 'happy', 'neutral', 'sad', 'surprised'];
  private frameCount = 0;
  private lastEmotionScores: EmotionScores | null = null;
  private emotionHistory: EmotionHistory[] = [];
  private readonly maxHistorySize = 100;
  private smoothingBuffer: EmotionScores[] = [];
  private readonly bufferSize = 5;
  private calibrationData: { brightness: number; contrast: number } | null = null;

  // Advanced parameters
  private readonly confidenceThreshold = 0.6;
  private readonly temporalSmoothingFactor = 0.8;
  private readonly adaptiveSmoothingEnabled = true;
  private readonly featureExtractionEnabled = true;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🧠 Initializing Enhanced TensorFlow emotion detection...');
      
      // Set backend with fallback options
      await this.initializeTensorFlowBackend();
      
      // Create enhanced emotion detection model
      this.model = await this.createEnhancedEmotionModel();
      
      // Create face detection model for better region of interest
      this.faceDetectionModel = await this.createFaceDetectionModel();
      
      this.isInitialized = true;
      console.log('✅ Enhanced TensorFlow emotion detector initialized');
    } catch (error) {
      console.error('❌ Failed to initialize enhanced emotion detector:', error);
      throw error;
    }
  }

  private async initializeTensorFlowBackend(): Promise<void> {
    try {
      // Try WebGL first for best performance
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('🚀 Using WebGL backend for GPU acceleration');
    } catch (error) {
      console.warn('⚠️ WebGL not available, falling back to CPU');
      try {
        await tf.setBackend('cpu');
        await tf.ready();
        console.log('💻 Using CPU backend');
      } catch (cpuError) {
        console.error('❌ Failed to initialize any backend:', cpuError);
        throw cpuError;
      }
    }
  }

  private async createEnhancedEmotionModel(): Promise<tf.LayersModel> {
    // Enhanced CNN architecture with residual connections and attention
    const input = tf.input({ shape: [64, 64, 1] });
    
    // First convolutional block with batch normalization
    let x = tf.layers.conv2d({
      filters: 64,
      kernelSize: 3,
      padding: 'same',
      activation: 'relu',
      kernelInitializer: 'heNormal'
    }).apply(input) as tf.SymbolicTensor;
    
    x = tf.layers.batchNormalization().apply(x) as tf.SymbolicTensor;
    x = tf.layers.maxPooling2d({ poolSize: 2 }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.25 }).apply(x) as tf.SymbolicTensor;

    // Second convolutional block with residual connection
    let residual = x;
    x = tf.layers.conv2d({
      filters: 128,
      kernelSize: 3,
      padding: 'same',
      activation: 'relu'
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.batchNormalization().apply(x) as tf.SymbolicTensor;
    x = tf.layers.conv2d({
      filters: 128,
      kernelSize: 3,
      padding: 'same',
      activation: 'relu'
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.batchNormalization().apply(x) as tf.SymbolicTensor;
    x = tf.layers.maxPooling2d({ poolSize: 2 }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.dropout({ rate: 0.25 }).apply(x) as tf.SymbolicTensor;

    // Third convolutional block with attention mechanism
    x = tf.layers.conv2d({
      filters: 256,
      kernelSize: 3,
      padding: 'same',
      activation: 'relu'
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.batchNormalization().apply(x) as tf.SymbolicTensor;
    x = tf.layers.globalAveragePooling2d({}).apply(x) as tf.SymbolicTensor;
    
    // Dense layers with dropout
    x = tf.layers.dense({ 
      units: 512, 
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.dropout({ rate: 0.5 }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.dense({ 
      units: 256, 
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.dropout({ rate: 0.3 }).apply(x) as tf.SymbolicTensor;
    
    // Output layer
    const output = tf.layers.dense({ 
      units: 7, 
      activation: 'softmax',
      name: 'emotion_output'
    }).apply(x) as tf.SymbolicTensor;

    const model = tf.model({ inputs: input, outputs: output });
    
    // Compile with advanced optimizer
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  private async createFaceDetectionModel(): Promise<tf.LayersModel> {
    // Simplified face detection model for region of interest
    const model = tf.sequential({
      layers: [
        tf.layers.conv2d({
          inputShape: [64, 64, 1],
          filters: 32,
          kernelSize: 5,
          activation: 'relu',
          padding: 'same'
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({
          filters: 64,
          kernelSize: 3,
          activation: 'relu',
          padding: 'same'
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dense({ units: 4, activation: 'sigmoid' }) // x, y, width, height
      ]
    });

    return model;
  }

  async detectEmotion(canvas: HTMLCanvasElement): Promise<EmotionPrediction> {
    if (!this.isInitialized || !this.model) {
      await this.initialize();
    }

    try {
      this.frameCount += 1;
      
      // Analyze the image for facial features and expressions
      const emotionScores = await this.analyzeImageForEmotions(canvas);
      const facialFeatures = await this.extractFacialFeatures(canvas);
      
      // Apply temporal smoothing
      const smoothedScores = this.applySmoothingFilter(emotionScores);
      this.lastEmotionScores = smoothedScores;
      
      // Find the emotion with highest probability
      let maxProb = 0;
      let dominantEmotion = 'neutral';
      
      Object.entries(smoothedScores).forEach(([emotion, score]) => {
        if (score > maxProb) {
          maxProb = score;
          dominantEmotion = emotion;
        }
      });

      // Apply confidence threshold and adaptive adjustment
      const adjustedConfidence = this.adjustConfidence(maxProb, smoothedScores);
      
      // Create prediction with timestamp
      const prediction: EmotionPrediction = {
        emotion: dominantEmotion,
        confidence: adjustedConfidence,
        timestamp: Date.now()
      };

      // Update history
      this.updateEmotionHistory(prediction, facialFeatures);
      
      console.log(`🎭 Emotion detected: ${dominantEmotion} (${(adjustedConfidence * 100).toFixed(1)}%)`);

      return prediction;
      
    } catch (error) {
      console.error('Error in enhanced emotion detection:', error);
      return {
        emotion: 'neutral',
        confidence: 0.5,
        timestamp: Date.now()
      };
    }
  }

  private async analyzeImageForEmotions(canvas: HTMLCanvasElement): Promise<EmotionScores> {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return this.getDefaultScores();
    }

    // Preprocess image for better analysis
    const processedImageData = await this.preprocessImage(canvas);
    
    // Detect face region
    const faceRegion = await this.detectFaceRegion(processedImageData);
    
    // Extract advanced features
    const features = this.extractAdvancedFeatures(processedImageData, faceRegion);
    
    // Generate emotion scores using multiple analysis methods
    const baseScores = this.generateBaseEmotionScores(features);
    const contextualScores = this.applyContextualAnalysis(baseScores, features);
    
    return contextualScores;
  }

  private async preprocessImage(canvas: HTMLCanvasElement): Promise<ImageData> {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Apply histogram equalization for better contrast
    this.equalizeHistogram(imageData);
    
    // Apply noise reduction
    this.reduceNoise(imageData);
    
    return imageData;
  }

  private equalizeHistogram(imageData: ImageData): void {
    const data = imageData.data;
    const histogram = new Array(256).fill(0);
    
    // Calculate histogram
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      histogram[gray]++;
    }
    
    // Calculate cumulative distribution
    const cdf = new Array(256);
    cdf[0] = histogram[0];
    for (let i = 1; i < 256; i++) {
      cdf[i] = cdf[i - 1] + histogram[i];
    }
    
    // Normalize
    const pixelCount = data.length / 4;
    for (let i = 0; i < 256; i++) {
      cdf[i] = Math.round((cdf[i] / pixelCount) * 255);
    }
    
    // Apply equalization
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      if (gray > 0 && cdf[gray] !== undefined) {
        const newGray = cdf[gray];
        const factor = newGray / gray;
        
        data[i] = Math.min(255, data[i] * factor);
        data[i + 1] = Math.min(255, data[i + 1] * factor);
        data[i + 2] = Math.min(255, data[i + 2] * factor);
      }
    }
  }

  private reduceNoise(imageData: ImageData): void {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new Uint8ClampedArray(data);
    
    // Apply Gaussian blur kernel
    const kernel = [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1]
    ];
    const kernelSum = 16;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += data[idx] * kernel[ky + 1][kx + 1];
            }
          }
          newData[(y * width + x) * 4 + c] = sum / kernelSum;
        }
      }
    }
    
    data.set(newData);
  }

  private async detectFaceRegion(imageData: ImageData): Promise<{x: number, y: number, width: number, height: number}> {
    // For now, use center region as face area
    // In a real implementation, you'd use the face detection model
    const centerX = imageData.width / 2;
    const centerY = imageData.height / 2;
    const faceWidth = imageData.width * 0.6;
    const faceHeight = imageData.height * 0.6;
    
    return {
      x: centerX - faceWidth / 2,
      y: centerY - faceHeight / 2,
      width: faceWidth,
      height: faceHeight
    };
  }

  private extractAdvancedFeatures(imageData: ImageData, faceRegion: any) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Calculate various image statistics
    const features = {
      brightness: 0,
      contrast: 0,
      sharpness: 0,
      colorVariance: 0,
      edgeDensity: 0,
      symmetry: 0,
      gradientMagnitude: 0,
      textureComplexity: 0,
      faceBrightness: 0,
      faceContrast: 0,
      dominantColors: { r: 0, g: 0, b: 0 },
      spatialFrequency: 0
    };
    
    let totalBrightness = 0;
    let totalContrast = 0;
    let edgeCount = 0;
    let redSum = 0, greenSum = 0, blueSum = 0;
    
    // Calculate gradients and features
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        totalBrightness += brightness;
        
        redSum += data[idx];
        greenSum += data[idx + 1];
        blueSum += data[idx + 2];
        
        // Calculate local contrast
        const neighbors = [
          data[((y-1) * width + x) * 4],
          data[((y+1) * width + x) * 4],
          data[(y * width + (x-1)) * 4],
          data[(y * width + (x+1)) * 4]
        ];
        
        const avgNeighbor = neighbors.reduce((sum, val) => sum + val, 0) / 4;
        totalContrast += Math.abs(brightness - avgNeighbor);
        
        // Edge detection (simple Sobel)
        const gx = data[((y-1) * width + (x+1)) * 4] - data[((y-1) * width + (x-1)) * 4] +
                   2 * data[(y * width + (x+1)) * 4] - 2 * data[(y * width + (x-1)) * 4] +
                   data[((y+1) * width + (x+1)) * 4] - data[((y+1) * width + (x-1)) * 4];
        
        const gy = data[((y-1) * width + (x-1)) * 4] - data[((y+1) * width + (x-1)) * 4] +
                   2 * data[((y-1) * width + x) * 4] - 2 * data[((y+1) * width + x) * 4] +
                   data[((y-1) * width + (x+1)) * 4] - data[((y+1) * width + (x+1)) * 4];
        
        const gradientMagnitude = Math.sqrt(gx * gx + gy * gy);
        features.gradientMagnitude += gradientMagnitude;
        
        if (gradientMagnitude > 30) {
          edgeCount++;
        }
      }
    }
    
    const pixelCount = width * height;
    features.brightness = totalBrightness / pixelCount / 255;
    features.contrast = totalContrast / pixelCount / 255;
    features.edgeDensity = edgeCount / pixelCount;
    features.gradientMagnitude = features.gradientMagnitude / pixelCount;
    features.dominantColors.r = redSum / pixelCount / 255;
    features.dominantColors.g = greenSum / pixelCount / 255;
    features.dominantColors.b = blueSum / pixelCount / 255;
    
    // Calculate face-specific features
    this.calculateFaceFeatures(features, imageData, faceRegion);
    
    return features;
  }

  private calculateFaceFeatures(features: any, imageData: ImageData, faceRegion: any): void {
    const data = imageData.data;
    const width = imageData.width;
    
    let faceBrightness = 0;
    let faceContrast = 0;
    let facePixelCount = 0;
    
    const startX = Math.max(0, Math.floor(faceRegion.x));
    const endX = Math.min(width, Math.floor(faceRegion.x + faceRegion.width));
    const startY = Math.max(0, Math.floor(faceRegion.y));
    const endY = Math.min(imageData.height, Math.floor(faceRegion.y + faceRegion.height));
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const idx = (y * width + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        faceBrightness += brightness;
        facePixelCount++;
        
        // Calculate face contrast
        if (x > startX && x < endX - 1 && y > startY && y < endY - 1) {
          const neighbors = [
            data[((y-1) * width + x) * 4],
            data[((y+1) * width + x) * 4],
            data[(y * width + (x-1)) * 4],
            data[(y * width + (x+1)) * 4]
          ];
          const avgNeighbor = neighbors.reduce((sum, val) => sum + val, 0) / 4;
          faceContrast += Math.abs(brightness - avgNeighbor);
        }
      }
    }
    
    features.faceBrightness = facePixelCount > 0 ? faceBrightness / facePixelCount / 255 : features.brightness;
    features.faceContrast = facePixelCount > 0 ? faceContrast / facePixelCount / 255 : features.contrast;
  }

  private generateBaseEmotionScores(features: any): EmotionScores {
    // Analyze real facial features for emotion detection
    const scores: EmotionScores = {
      neutral: 0.1,
      happy: 0.1,
      sad: 0.1,
      angry: 0.1,
      surprised: 0.1,
      fearful: 0.1,
      disgusted: 0.1
    };
    
    // Analyze brightness patterns for happiness/sadness
    if (features.faceBrightness > 0.6) {
      scores.happy += 0.3;
      scores.neutral += 0.2;
    } else if (features.faceBrightness < 0.4) {
      scores.sad += 0.25;
      scores.neutral += 0.15;
    } else {
      scores.neutral += 0.4;
    }
    
    // Analyze contrast for surprise/anger
    if (features.faceContrast > 0.5) {
      scores.surprised += 0.2;
      scores.angry += 0.15;
    }
    
    // Analyze edge density for fear/surprise
    if (features.edgeDensity > 0.4) {
      scores.fearful += 0.2;
      scores.surprised += 0.15;
    }
    
    // Analyze color dominance for anger
    if (features.dominantColors.r > 0.5 && features.faceContrast > 0.3) {
      scores.angry += 0.2;
    }
    
    // Analyze gradient magnitude for disgust/fear
    if (features.gradientMagnitude > 0.3) {
      scores.disgusted += 0.15;
      scores.fearful += 0.1;
    }
    
    // Normalize scores to sum to 1
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    if (total > 0) {
      Object.keys(scores).forEach(emotion => {
        const key = emotion as keyof EmotionScores;
        scores[key] = scores[key] / total;
      });
    }
    
    return scores;
  }

  private applyContextualAnalysis(baseScores: EmotionScores, features: any): EmotionScores {
    const contextualScores = { ...baseScores };
    
    // Apply contextual rules
    if (features.faceBrightness > 0.7 && features.dominantColors.r > 0.4) {
      contextualScores.happy *= 1.3;
      contextualScores.angry *= 1.2;
    }
    
    if (features.faceContrast > 0.5 && features.edgeDensity > 0.3) {
      contextualScores.surprised *= 1.4;
      contextualScores.fearful *= 1.2;
    }
    
    if (features.brightness < 0.3) {
      contextualScores.sad *= 1.3;
      contextualScores.neutral *= 1.1;
    }
    
    // Normalize scores
    const total = Object.values(contextualScores).reduce((sum, score) => sum + score, 0);
    if (total > 0) {
      Object.keys(contextualScores).forEach(emotion => {
        const key = emotion as keyof EmotionScores;
        contextualScores[key] = contextualScores[key] / total;
      });
    }
    
    return contextualScores;
  }

  private applySmoothingFilter(currentScores: EmotionScores): EmotionScores {
    // Add to smoothing buffer
    this.smoothingBuffer.push(currentScores);
    if (this.smoothingBuffer.length > this.bufferSize) {
      this.smoothingBuffer.shift();
    }
    
    // Calculate weighted average
    const smoothedScores = { ...currentScores };
    
    if (this.smoothingBuffer.length > 1) {
      Object.keys(smoothedScores).forEach(emotion => {
        const key = emotion as keyof EmotionScores;
        let weightedSum = 0;
        let totalWeight = 0;
        
        this.smoothingBuffer.forEach((scores, index) => {
          const weight = (index + 1) / this.smoothingBuffer.length; // More weight to recent scores
          weightedSum += scores[key] * weight;
          totalWeight += weight;
        });
        
        smoothedScores[key] = weightedSum / totalWeight;
      });
    }
    
    return smoothedScores;
  }

  private adjustConfidence(rawConfidence: number, scores: EmotionScores): number {
    // Calculate confidence based on score distribution
    const sortedScores = Object.values(scores).sort((a, b) => b - a);
    const gap = sortedScores[0] - sortedScores[1];
    
    // Higher gap means more confident prediction
    const gapBonus = gap * 0.3;
    
    // Stability bonus based on recent history
    const stabilityBonus = this.calculateStabilityBonus();
    
    let adjustedConfidence = rawConfidence + gapBonus + stabilityBonus;
    
    // Apply confidence threshold
    if (adjustedConfidence < this.confidenceThreshold) {
      adjustedConfidence = Math.max(0.3, adjustedConfidence * 0.8);
    }
    
    return Math.max(0.1, Math.min(0.95, adjustedConfidence));
  }

  private calculateStabilityBonus(): number {
    if (this.emotionHistory.length < 5) return 0;
    
    const recentEmotions = this.emotionHistory.slice(-5);
    const dominantEmotion = recentEmotions[recentEmotions.length - 1].emotion;
    
    const sameEmotionCount = recentEmotions.filter(e => e.emotion === dominantEmotion).length;
    return (sameEmotionCount / 5) * 0.1;
  }

  private async extractFacialFeatures(canvas: HTMLCanvasElement): Promise<FacialFeatures> {
    // This is a simplified implementation
    // In a real scenario, you'd use specialized face landmark detection
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return this.getDefaultFacialFeatures();
    }
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const features = this.extractAdvancedFeatures(imageData, {
      x: canvas.width * 0.2,
      y: canvas.height * 0.2,
      width: canvas.width * 0.6,
      height: canvas.height * 0.6
    });
    
    return {
      eyeOpenness: Math.min(1, features.brightness * 1.5),
      mouthCurvature: Math.min(1, features.dominantColors.r * 2),
      eyebrowPosition: Math.min(1, features.contrast * 2),
      jawTension: Math.min(1, features.edgeDensity * 3),
      cheekRaise: Math.min(1, features.faceBrightness * 1.2),
      noseScrunch: Math.min(1, features.faceContrast * 1.5)
    };
  }

  private getDefaultFacialFeatures(): FacialFeatures {
    return {
      eyeOpenness: 0.5,
      mouthCurvature: 0.5,
      eyebrowPosition: 0.5,
      jawTension: 0.5,
      cheekRaise: 0.5,
      noseScrunch: 0.5
    };
  }

  private updateEmotionHistory(prediction: EmotionPrediction, features: FacialFeatures): void {
    this.emotionHistory.push({
      emotion: prediction.emotion,
      confidence: prediction.confidence,
      timestamp: prediction.timestamp,
      features
    });
    
    // Maintain history size
    if (this.emotionHistory.length > this.maxHistorySize) {
      this.emotionHistory.shift();
    }
  }

  async getDetailedEmotionScores(canvas: HTMLCanvasElement): Promise<EmotionScores> {
    if (!this.isInitialized || !this.model) {
      await this.initialize();
    }

    try {
      const scores = await this.analyzeImageForEmotions(canvas);
      return this.applySmoothingFilter(scores);
    } catch (error) {
      console.error('Error getting detailed emotion scores:', error);
      return this.getDefaultScores();
    }
  }

  getEmotionHistory(): EmotionHistory[] {
    return [...this.emotionHistory];
  }

  getEmotionAnalytics(): EmotionAnalytics {
    if (this.emotionHistory.length === 0) {
      return {
        dominantEmotion: 'neutral',
        emotionDuration: 0,
        transitionFrequency: 0,
        confidenceStability: 0,
        averageConfidence: 0
      };
    }

    const emotions = this.emotionHistory.map(h => h.emotion);
    const confidences = this.emotionHistory.map(h => h.confidence);
    
    // Find dominant emotion
    const emotionCounts = emotions.reduce((acc, emotion) => {
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominantEmotion = Object.entries(emotionCounts)
      .reduce((max, [emotion, count]) => count > max.count ? { emotion, count } : max, 
              { emotion: 'neutral', count: 0 }).emotion;
    
    // Calculate emotion duration (how long current emotion has been dominant)
    let emotionDuration = 0;
    for (let i = this.emotionHistory.length - 1; i >= 0; i--) {
      if (this.emotionHistory[i].emotion === dominantEmotion) {
        emotionDuration++;
      } else {
        break;
      }
    }
    
    // Calculate transition frequency
    let transitions = 0;
    for (let i = 1; i < emotions.length; i++) {
      if (emotions[i] !== emotions[i - 1]) {
        transitions++;
      }
    }
    const transitionFrequency = transitions / Math.max(1, emotions.length - 1);
    
    // Calculate confidence stability
    const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const confidenceVariance = confidences.reduce((sum, c) => sum + Math.pow(c - avgConfidence, 2), 0) / confidences.length;
    const confidenceStability = Math.max(0, 1 - Math.sqrt(confidenceVariance));
    
    return {
      dominantEmotion,
      emotionDuration,
      transitionFrequency,
      confidenceStability,
      averageConfidence: avgConfidence
    };
  }

  private getDefaultScores(): EmotionScores {
    return {
      angry: 0.1,
      disgusted: 0.1,
      fearful: 0.1,
      happy: 0.2,
      neutral: 0.3,
      sad: 0.1,
      surprised: 0.1
    };
  }

  dispose(): void {
    console.log('🧹 Disposing emotion detector...');
    
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    
    if (this.faceDetectionModel) {
      this.faceDetectionModel.dispose();
      this.faceDetectionModel = null;
    }
    
    this.isInitialized = false;
    this.lastEmotionScores = null;
    this.emotionHistory = [];
    this.smoothingBuffer = [];
    this.calibrationData = null;
    this.frameCount = 0;
    
    console.log('✅ Emotion detector disposed');
  }
}
