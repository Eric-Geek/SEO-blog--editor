import imageCompression from 'browser-image-compression';

/**
 * 压缩图片并转换为WebP格式
 * @param blob 原始图片Blob
 * @param originalName 原始文件名
 * @param maxSizeKB 最大文件大小（KB），默认50KB
 * @returns 压缩后的WebP格式Blob和新文件名
 */
export async function compressAndConvertToWebP(
  blob: Blob,
  originalName: string,
  maxSizeKB: number = 50
): Promise<{ compressedBlob: Blob; newFileName: string }> {
  try {
    // 获取原始文件名（不含扩展名）
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const newFileName = `${nameWithoutExt}.webp`;

    // 将Blob转换为File对象（browser-image-compression需要File类型）
    const file = new File([blob], originalName, { type: blob.type });
    
    // 首先尝试使用browser-image-compression进行初步压缩
    const options = {
      maxSizeMB: maxSizeKB / 1024, // 转换为MB
      maxWidthOrHeight: 1920, // 限制最大宽高，避免过大的图片
      useWebWorker: true,
      fileType: 'image/webp', // 指定输出格式为WebP
    };

    let compressedBlob: Blob = await imageCompression(file, options);

    // 如果压缩后仍然超过目标大小，使用Canvas进一步压缩
    if (compressedBlob.size > maxSizeKB * 1024) {
      compressedBlob = await furtherCompressWithCanvas(compressedBlob, maxSizeKB);
    }

    return {
      compressedBlob,
      newFileName
    };
  } catch (error) {
    console.error('图片压缩失败:', error);
    // 如果压缩失败，返回原始blob但改为webp扩展名
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return {
      compressedBlob: blob,
      newFileName: `${nameWithoutExt}.webp`
    };
  }
}

/**
 * 使用Canvas进一步压缩图片
 * @param blob 图片Blob
 * @param maxSizeKB 目标大小（KB）
 * @returns 压缩后的Blob
 */
async function furtherCompressWithCanvas(blob: Blob, maxSizeKB: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    img.onload = async () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // 计算新的尺寸（如果需要缩小）
      let { width, height } = img;
      const maxSize = 1920;
      
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // 二分法找到合适的压缩质量
      let quality = 0.8;
      let minQuality = 0.1;
      let maxQuality = 0.95;
      let compressedBlob: Blob = blob;
      
      for (let i = 0; i < 10; i++) {
        const tempBlob = await new Promise<Blob>((res) => {
          canvas.toBlob((b) => res(b!), 'image/webp', quality);
        });
        
        if (tempBlob.size <= maxSizeKB * 1024) {
          compressedBlob = tempBlob;
          // 如果已经小于目标，尝试提高质量
          minQuality = quality;
          quality = (quality + maxQuality) / 2;
        } else {
          // 如果还是太大，降低质量
          maxQuality = quality;
          quality = (minQuality + quality) / 2;
        }
        
        // 如果质量变化很小了，就停止
        if (maxQuality - minQuality < 0.05) {
          break;
        }
      }
      
      resolve(compressedBlob);
    };
    
    img.src = url;
  });
}

/**
 * 批量压缩图片
 * @param images 图片文件数组
 * @param maxSizeKB 最大文件大小（KB）
 * @param onProgress 进度回调
 * @returns 压缩后的图片数组
 */
export async function batchCompressImages(
  images: Array<{ blob: Blob; originalPath: string }>,
  maxSizeKB: number = 50,
  onProgress?: (current: number, total: number) => void
): Promise<Array<{ blob: Blob; originalPath: string; newPath: string }>> {
  const results = [];
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    
    // 获取文件名
    const fileName = image.originalPath.split('/').pop() || 'image.jpg';
    
    // 跳过SVG文件（SVG不需要压缩）
    if (fileName.toLowerCase().endsWith('.svg')) {
      results.push({
        blob: image.blob,
        originalPath: image.originalPath,
        newPath: image.originalPath // SVG保持原路径
      });
      continue;
    }
    
    try {
      const { compressedBlob, newFileName } = await compressAndConvertToWebP(
        image.blob,
        fileName,
        maxSizeKB
      );
      
      // 构建新路径
      const pathParts = image.originalPath.split('/');
      pathParts[pathParts.length - 1] = newFileName;
      const newPath = pathParts.join('/');
      
      results.push({
        blob: compressedBlob,
        originalPath: image.originalPath,
        newPath: newPath
      });
    } catch (error) {
      console.error(`压缩图片失败: ${fileName}`, error);
      // 如果失败，保留原始图片
      results.push({
        blob: image.blob,
        originalPath: image.originalPath,
        newPath: image.originalPath
      });
    }
    
    // 触发进度回调
    if (onProgress) {
      onProgress(i + 1, images.length);
    }
  }
  
  return results;
}

/**
 * 获取图片压缩统计信息
 * @param originalSize 原始大小（字节）
 * @param compressedSize 压缩后大小（字节）
 * @returns 统计信息
 */
export function getCompressionStats(originalSize: number, compressedSize: number) {
  const reduction = originalSize - compressedSize;
  const reductionPercentage = ((reduction / originalSize) * 100).toFixed(1);
  
  return {
    originalSize: formatFileSize(originalSize),
    compressedSize: formatFileSize(compressedSize),
    reduction: formatFileSize(reduction),
    reductionPercentage: `${reductionPercentage}%`
  };
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
