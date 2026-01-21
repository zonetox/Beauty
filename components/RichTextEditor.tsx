// components/RichTextEditor.tsx
import React, { useRef, useEffect } from 'react';

// Quill is loaded from a CDN script, so we declare it to satisfy TypeScript.
declare const Quill: any;

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder = "Viết nội dung của bạn ở đây..." }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<any>(null);

    // This effect initializes the Quill editor. It runs only once.
    useEffect(() => {
        if (editorRef.current && !quillRef.current) {
            const toolbarOptions = [
                [{ 'header': [2, 3, false] }], // h2, h3
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['link', 'image'],
                ['blockquote', 'code-block'],
                ['clean']
            ];

            quillRef.current = new Quill(editorRef.current, {
                modules: {
                    toolbar: toolbarOptions,
                },
                placeholder: placeholder,
                theme: 'snow'
            });

            // Set initial content
            const quill = quillRef.current;
            quill.clipboard.dangerouslyPasteHTML(value || '');

            // Add listener for text changes
            quill.on('text-change', (_delta: any, _oldDelta: any, source: string) => {
                if (source === 'user') {
                    onChange(quill.root.innerHTML);
                }
            });
        }

        // Cleanup function to destroy the Quill instance
        return () => {
            if (quillRef.current && quillRef.current.container) {
                quillRef.current.container.innerHTML = ''; // Clean up DOM
            }
            quillRef.current = null;
        };
    }, []); // Empty dependency array ensures this effect runs only once on mount

    // This effect syncs the editor content if the `value` prop changes externally.
    useEffect(() => {
        const quill = quillRef.current;
        if (quill) {
            // Check if the content is different before updating to prevent infinite loops.
            if (value !== quill.root.innerHTML) {
                // It's safer to paste HTML to preserve formatting.
                // The 'silent' source prevents the 'text-change' event from firing and causing a loop.
                quill.clipboard.dangerouslyPasteHTML(value, 'silent');
            }
        }
    }, [value]);

    return (
        <div>
            <div ref={editorRef} />
        </div>
    );
};

export default RichTextEditor;
