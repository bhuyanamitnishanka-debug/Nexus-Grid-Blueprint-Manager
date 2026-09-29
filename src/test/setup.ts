import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock THREE.WebGLRenderer for jsdom testing
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three');
  class MockWebGLRenderer {
    domElement: HTMLCanvasElement;
    constructor() {
      this.domElement = document.createElement('canvas');
    }
    setSize() {}
    setPixelRatio() {}
    setClearColor() {}
    render() {}
    dispose() {}
  }
  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
  };
});

// Vitest setup file for jsdom testing
if (typeof window !== 'undefined') {
  // Mock window.scroll and scrollIntoView
  window.scrollTo = () => {};
  Element.prototype.scrollIntoView = () => {};

  // Mock HTMLCanvasElement getContext for 2D charts and canvases
  HTMLCanvasElement.prototype.getContext = (() => {
    return {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: (x: number, y: number, w: number, h: number) => ({
        data: new Array(w * h * 4).fill(0),
      }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
    } as unknown as RenderingContext;
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  // Mock requestAnimationFrame
  window.requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(() => callback(Date.now()), 16) as unknown as number;
  };
  window.cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };

  // Mock ResizeObserver
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}
