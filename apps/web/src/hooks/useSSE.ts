import { useState, useCallback, useRef } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { SubmissionStatusStreamEvent } from '@aica/shared';
import { useAuthStore } from '../store/useAuthStore';

export function useSubmissionSSE(submissionId: string | null) {
  const [currentEvent, setCurrentEvent] = useState<SubmissionStatusStreamEvent | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);

  const startStream = useCallback((id: string) => {
    if (ctrlRef.current) {
      ctrlRef.current.abort();
    }

    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setIsStreaming(true);
    setStreamError(null);

    const token = useAuthStore.getState().accessToken;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const apiBase = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/v1`
      : '/api/v1';

    fetchEventSource(`${apiBase}/submissions/${id}/status-stream`, {
      method: 'GET',
      headers,
      signal: ctrl.signal,
      onmessage(ev) {
        if (ev.data) {
          try {
            const data: SubmissionStatusStreamEvent = JSON.parse(ev.data);
            setCurrentEvent(data);
            if (data.pipelineStatus === 'COMPLETED' || data.pipelineStatus === 'FAILED') {
              setIsStreaming(false);
              ctrl.abort();
            }
          } catch {
            // Ignored if non-json keep-alive
          }
        }
      },
      onerror(err) {
        console.warn('[useSubmissionSSE] SSE stream error:', err);
        setStreamError('Connection interrupted. Polling fallback active.');
        setIsStreaming(false);
        ctrl.abort();
      }
    });
  }, []);

  const stopStream = useCallback(() => {
    if (ctrlRef.current) {
      ctrlRef.current.abort();
      ctrlRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  return {
    currentEvent,
    isStreaming,
    streamError,
    startStream,
    stopStream
  };
}
