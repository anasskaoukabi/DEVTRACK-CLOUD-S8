import React, { useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Icônes SVG compactes
const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  bold:        'M6 4h8a4 4 0 010 8H6z M6 12h9a4 4 0 010 8H6z',
  italic:      'M19 4h-9M14 20H5M15 4L9 20',
  underline:   'M6 4v6a6 6 0 0012 0V4M4 20h16',
  strike:      'M16 4H9a3 3 0 000 6h6a3 3 0 010 6H6M4 12h16',
  h1:          'M4 12h8M4 6v12M12 6v12M17 10l2-2v8',
  h2:          'M4 12h8M4 6v12M12 6v12M16 10h2a2 2 0 010 4h-2v2h4',
  h3:          'M4 12h8M4 6v12M12 6v12M16 10h4M18 10v4M16 14h4',
  ul:          'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  ol:          'M10 6h11M10 12h11M10 18h11M4 6h1M4 12l1 2H4M3 18h2v-3',
  task:        'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
  quote:       'M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm7 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z',
  code:        'M16 18l6-6-6-6M8 6L2 12l6 6',
  hr:          'M5 12h14',
  table:       'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  image:       'M21 15l-5-5L5 20m14-9V3H5v12M3 3l18 18',
  alignL:      'M3 6h18M3 12h12M3 18h15',
  alignC:      'M3 6h18M6 12h12M4 18h16',
  alignR:      'M3 6h18M9 12h12M6 18h15',
  highlight:   'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 6v6l4 2',
  undo:        'M3 7v6h6M3.51 15a9 9 0 101.5-5.04',
  redo:        'M21 7v6h-6M20.49 15a9 9 0 10-1.5-5.04',
  plus:        'M12 5v14M5 12h14',
  addRow:      'M3 10h18M3 14h18M3 18h18M3 6h18',
  addCol:      'M10 3v18M14 3v18M6 3v18M18 3v18',
};

const Btn = ({ label, active, onClick, disabled, children, title }) => (
  <button
    type="button"
    title={title || label}
    onClick={onClick}
    disabled={disabled}
    className={`p-1.5 rounded transition-all duration-100 flex items-center justify-center
      ${active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-slate-200 mx-0.5 flex-shrink-0" />;

export default function EditorToolbar({ editor, docId, docTitle }) {
  const imageInputRef = useRef(null);

  if (!editor) return null;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const toastId = toast.loading('Upload en cours…');
    try {
      const token = localStorage.getItem('devtrack_token');
      const res = await fetch('/api/uploads/image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
        toast.success('Image insérée !', { id: toastId });
      } else {
        toast.error('Échec de l\'upload', { id: toastId });
      }
    } catch (err) {
      toast.error('Erreur upload', { id: toastId });
    }
    e.target.value = '';
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const handleExportPDF = async () => {
    if (!docId) { toast.error('Sauvegardez d\'abord le document.'); return; }
    const toastId = toast.loading('Génération PDF…');
    try {
      const token = localStorage.getItem('devtrack_token');
      const res = await fetch(`/api/document-editor/${docId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('PDF failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docTitle || 'document'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF téléchargé !', { id: toastId });
    } catch {
      toast.error('Erreur de génération PDF', { id: toastId });
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-0.5 flex-wrap shadow-sm">
      {/* Undo / Redo */}
      <Btn title="Annuler (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Ico d={ICONS.undo} />
      </Btn>
      <Btn title="Rétablir (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Ico d={ICONS.redo} />
      </Btn>

      <Divider />

      {/* Titres */}
      <Btn title="Titre 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        <span className="text-xs font-bold w-4 text-center">H1</span>
      </Btn>
      <Btn title="Titre 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <span className="text-xs font-bold w-4 text-center">H2</span>
      </Btn>
      <Btn title="Titre 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <span className="text-xs font-bold w-4 text-center">H3</span>
      </Btn>

      <Divider />

      {/* Formatage */}
      <Btn title="Gras (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Ico d={ICONS.bold} />
      </Btn>
      <Btn title="Italique (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Ico d={ICONS.italic} />
      </Btn>
      <Btn title="Souligné (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Ico d={ICONS.underline} />
      </Btn>
      <Btn title="Barré" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Ico d={ICONS.strike} />
      </Btn>
      <Btn title="Surligner" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}>
        <span className="text-xs font-bold" style={{ textDecoration: 'underline', textDecorationColor: '#eab308', textDecorationThickness: 3 }}>A</span>
      </Btn>
      <Btn title="Code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Ico d={ICONS.code} />
      </Btn>

      <Divider />

      {/* Listes */}
      <Btn title="Liste à puces" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <Ico d={ICONS.ul} />
      </Btn>
      <Btn title="Liste numérotée" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <Ico d={ICONS.ol} />
      </Btn>
      <Btn title="Liste de tâches" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <Ico d={ICONS.task} />
      </Btn>

      <Divider />

      {/* Alignement */}
      <Btn title="Aligner à gauche" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
        <Ico d={ICONS.alignL} />
      </Btn>
      <Btn title="Centrer" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
        <Ico d={ICONS.alignC} />
      </Btn>
      <Btn title="Aligner à droite" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
        <Ico d={ICONS.alignR} />
      </Btn>

      <Divider />

      {/* Blocs spéciaux */}
      <Btn title="Citation" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Ico d={ICONS.quote} />
      </Btn>
      <Btn title="Bloc de code" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <span className="text-xs font-mono font-bold">{'{}'}</span>
      </Btn>
      <Btn title="Séparateur horizontal" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Ico d={ICONS.hr} />
      </Btn>

      <Divider />

      {/* Tableau */}
      <Btn title="Insérer un tableau" onClick={insertTable}>
        <Ico d={ICONS.table} />
      </Btn>
      {editor.isActive('table') && (
        <>
          <Btn title="Ajouter une ligne" onClick={() => editor.chain().focus().addRowAfter().run()}>
            <span className="text-xs font-bold">+ligne</span>
          </Btn>
          <Btn title="Ajouter une colonne" onClick={() => editor.chain().focus().addColumnAfter().run()}>
            <span className="text-xs font-bold">+col</span>
          </Btn>
          <Btn title="Supprimer la ligne" onClick={() => editor.chain().focus().deleteRow().run()}>
            <span className="text-xs font-bold text-red-500">-ligne</span>
          </Btn>
          <Btn title="Supprimer le tableau" onClick={() => editor.chain().focus().deleteTable().run()}>
            <span className="text-xs font-bold text-red-500">×tab</span>
          </Btn>
        </>
      )}

      <Divider />

      {/* Image */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <Btn title="Insérer une image" onClick={() => imageInputRef.current?.click()}>
        <Ico d={ICONS.image} />
      </Btn>

      {/* Séparateur + Export */}
      <div className="flex-1" />

      <Btn title="Exporter en PDF" onClick={handleExportPDF}>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors">
          <svg width={13} height={13} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          PDF
        </div>
      </Btn>
    </div>
  );
}
