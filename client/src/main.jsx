import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import TextEditor from './TextEditor';
import { v4 as uuidV4 } from 'uuid';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={`/docs/${uuidV4()}`} />} />
        <Route path="/docs/:id" element={<TextEditor />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
