import { FileStructure } from "@/types/neo4j";

/**
 * Format bytes to human readable size
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes || isNaN(bytes)) return 'Unknown size';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format date string
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'Unknown date';
  try {
    return new Date(dateString).toLocaleString();
  } catch (error) {
    return dateString;
  }
};

/**
 * Get file icon based on extension
 */
export const getFileIcon = (extension: string): string => {
  const ext = extension?.toLowerCase() || '';

  if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext)) {
    return 'image';
  }
  if (['.pdf'].includes(ext)) return 'pdf';
  if (['.doc', '.docx'].includes(ext)) return 'word';
  if (['.xls', '.xlsx'].includes(ext)) return 'excel';
  if (['.pptx'].includes(ext)) return 'powerpoint';
  if (['.zip', '.rar', '.7z'].includes(ext)) return 'archive';
  if (['.mp4', '.avi', '.mov', '.wmv'].includes(ext)) return 'video';
  if (['.mp3', '.wav', '.flac'].includes(ext)) return 'audio';
  return 'document';
};

/**
 * Calculate total size of a node
 */
export const calculateTotalSize = (node: { type: string; size?: number; children?: any[] }): number => {
  if (node.type === 'file') {
    return node.size || 0;
  }
  return node.children?.reduce((sum, child) => sum + calculateTotalSize(child), 0) || 0;
};


// export const truncateFileName = (node: FileStructure) => {
//   const { name } = node
//   return (name.length < 32) ? name : name.substring(0, 32) + '...'
// }

export const truncateFileName = (node: FileStructure, maxLength = 52): string => {
  if (!node || !node.name) return '';

  const fullName = node.name;

  const lastDot = fullName.lastIndexOf('.');
  if (lastDot === -1) {
    // No extension – simple fallback
    return fullName.length <= maxLength
      ? fullName
      : fullName.slice(0, maxLength - 3) + '...';
  }

  const name = fullName.slice(0, lastDot);      // part before extension
  const ext = fullName.slice(lastDot);          // ✅ real extension (".pdf", etc.)

  // If the full name already fits, return unchanged
  if (fullName.length <= maxLength) return fullName;

  // We want: "<start> ... <end><ext>"
  const reserved = ext.length + ' ... '.length;
  const available = maxLength - reserved;

  if (available <= 0) return fullName; // safety fallback

  const keepStart = Math.floor(available * 0.9);
  const keepEnd = available - keepStart;

  const startPart = name.slice(0, keepStart).trimEnd();
  const endPart = name.slice(-keepEnd).trimStart();

  return `${startPart} ... ${endPart}${ext}`;
};

export function truncateChatTitle(message: string): string {
  if (!message) return 'New Chat';

  // Take first 30 chars
  let title = message.substring(0, 30);

  // If message was longer than 30 chars, add ellipsis
  if (message.length > 30) {
    title += '...';
  }

  return title;
}
