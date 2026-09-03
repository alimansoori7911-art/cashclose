/** تصویر پیوست‌شده به یک تراکنش. */
export interface UploadedImage {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}
