// Global type declarations for Node.js compatibility

declare global {
  interface BufferConstructor {
    isBuffer(obj: any): obj is Buffer;
  }
}

export {};
