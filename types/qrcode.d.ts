declare module 'qrcode' {
  interface ToDataURLOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    type?: string;
    rendererOpts?: Record<string, any>;
    width?: number;
    margin?: number;
  }
  function toDataURL(text: string, options?: ToDataURLOptions): Promise<string>;
  export = { toDataURL };
}
