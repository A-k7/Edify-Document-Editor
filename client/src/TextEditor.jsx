import { useEffect, useCallback, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';

const SAVE_INTERVAL_MS = 2000;
const TOOLBAR_OPTIONS = [
  ['bold', 'italic', 'underline', 'strike'],
  [{ header: [1, 2, 3, false] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link', 'image'],
  ['clean'],
];

export default function TextEditor() {
  const [socket, setSocket] = useState(null);
  const [quill, setQuill] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id: documentId } = useParams();

  // Connect to backend
  useEffect(() => {
    const s = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ['websocket'], // force websocket for Render
});
    s.on('connect_error', (err) =>
      console.error('Socket connection failed:', err.message)
    );
    setSocket(s);
    return () => s.disconnect();
  }, []);

  // Load initial document
  useEffect(() => {
    if (!socket || !quill) return;

    socket.once('load-document', (document) => {
      quill.setContents(document);
      quill.enable();
      setLoading(false);
    });

    socket.emit('get-document', documentId);
  }, [socket, quill, documentId]);

  // Auto save every few seconds
  useEffect(() => {
    if (!socket || !quill) return;

    const interval = setInterval(() => {
      socket.emit('save-document', quill.getContents());
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [socket, quill]);

  // Receive remote changes
  useEffect(() => {
    if (!socket || !quill) return;

    const handler = (delta) => quill.updateContents(delta);
    socket.on('receive-changes', handler);
    return () => socket.off('receive-changes', handler);
  }, [socket, quill]);

  // Broadcast user changes
  useEffect(() => {
    if (!socket || !quill) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== 'user') return;
      socket.emit('send-changes', delta);
    };

    quill.on('text-change', handler);
    return () => quill.off('text-change', handler);
  }, [socket, quill]);

  // Quill init
  const wrapperRef = useCallback((wrapper) => {
    if (!wrapper) return;

    wrapper.innerHTML = '';
    const editor = document.createElement('div');
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: 'snow',
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    q.disable();
    q.setText('Loading...');
    setQuill(q);
  }, []);

  return (
    <>
      {loading && <div className="loading-text">Loading Document...</div>}
      <div className="container" ref={wrapperRef}></div>
    </>
  );
}
