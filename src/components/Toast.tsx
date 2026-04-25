'use client';

import { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  show: boolean;
  onHide: () => void;
  duration?: number;
}

export default function Toast({ message, show, onHide, duration = 2500 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onHide, 400);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onHide]);

  return (
    <div className={`toast ${visible ? 'show' : ''}`} id="toast-notification">
      ✅ {message}
    </div>
  );
}
