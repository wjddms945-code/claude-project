import { useState, useCallback, useRef } from 'react';

export type MicrophoneStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'unsupported';

interface UseMicrophoneResult {
  status: MicrophoneStatus;
  stream: MediaStream | null;
  requestPermission: () => Promise<boolean>;
  stopRecording: () => void;
  error: string | null;
}

export function useMicrophone(): UseMicrophoneResult {
  const [status, setStatus] = useState<MicrophoneStatus>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('unsupported');
      setError('이 브라우저는 마이크를 지원하지 않습니다.');
      return false;
    }

    setStatus('requesting');
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setStatus('active');
      return true;
    } catch (err) {
      if (err instanceof DOMException) {
        if (
          err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError'
        ) {
          setStatus('denied');
          setError('마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
        } else if (
          err.name === 'NotFoundError' ||
          err.name === 'DevicesNotFoundError'
        ) {
          setStatus('unsupported');
          setError('마이크 장치를 찾을 수 없습니다.');
        } else {
          setStatus('denied');
          setError(`마이크 접근 오류: ${err.message}`);
        }
      } else {
        setStatus('denied');
        setError('마이크에 접근할 수 없습니다.');
      }
      return false;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }
    setStatus('idle');
  }, []);

  return { status, stream, requestPermission, stopRecording, error };
}
