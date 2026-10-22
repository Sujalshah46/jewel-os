/**
 * Electronic Jewellery Weighing Scale Driver & Hook
 * Supports Web Serial API (navigator.serial) for RS-232 / USB-to-Serial Digital Scales.
 * Compatible with Essae-Teraoka, CAS, Phoenix, Contech, Gold Star, and Mettler-Toledo.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { parseScaleWeightString } from './weighingScaleParser';

export { parseScaleWeightString };

/**
 * Custom React Hook for live weighing scale connection
 */
export function useWeighingScale() {
  const [isSupported, setIsSupported] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [isStable, setIsStable] = useState(true);
  const [error, setError] = useState(null);
  const [isSimulated, setIsSimulated] = useState(false);

  const portRef = useRef(null);
  const readerRef = useRef(null);
  const keepReadingRef = useRef(false);

  useEffect(() => {
    setIsSupported(typeof navigator !== 'undefined' && 'serial' in navigator);
  }, []);

  // Connect to physical scale via Web Serial API
  const connectPhysicalScale = useCallback(async (baudRate = 9600) => {
    setError(null);
    if (!navigator.serial) {
      setError('Web Serial API is not supported in this browser. Use Chrome or Edge, or switch to simulated scale.');
      return false;
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({
        baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });

      portRef.current = port;
      keepReadingRef.current = true;
      setIsConnected(true);
      setIsSimulated(false);

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      (async () => {
        let buffer = '';
        try {
          while (keepReadingRef.current) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              buffer += value;
              const lines = buffer.split(/[\r\n]+/);
              buffer = lines.pop(); // Keep incomplete chunk
              for (const line of lines) {
                if (line.trim()) {
                  const parsed = parseScaleWeightString(line);
                  setCurrentWeight(parsed.weight);
                  setIsStable(parsed.isStable);
                }
              }
            }
          }
        } catch (err) {
          console.warn('[Weighing Scale] Read loop ended:', err);
        } finally {
          reader.releaseLock();
        }
      })();

      return true;
    } catch (err) {
      console.error('[Weighing Scale] Connection failed:', err);
      setError(err.message || 'Failed to connect to scale port');
      setIsConnected(false);
      return false;
    }
  }, []);

  // Disconnect scale
  const disconnectScale = useCallback(async () => {
    keepReadingRef.current = false;
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch {}
      readerRef.current = null;
    }
    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch {}
      portRef.current = null;
    }
    setIsConnected(false);
    setIsSimulated(false);
  }, []);

  // Simulated mode (for demo/testing or counters without physical serial cable)
  const connectSimulatedScale = useCallback((initialWeight = 7.825) => {
    disconnectScale();
    setIsSimulated(true);
    setIsConnected(true);
    setCurrentWeight(initialWeight);
    setIsStable(true);
  }, [disconnectScale]);

  const setManualSimulatedWeight = useCallback((weight) => {
    setCurrentWeight(Number(Number(weight).toFixed(3)) || 0);
    setIsStable(true);
  }, []);

  return {
    isSupported,
    isConnected,
    isSimulated,
    currentWeight,
    isStable,
    error,
    connectPhysicalScale,
    connectSimulatedScale,
    setManualSimulatedWeight,
    disconnectScale
  };
}
